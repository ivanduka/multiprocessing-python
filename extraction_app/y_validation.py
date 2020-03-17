from pathlib import Path
from dotenv import load_dotenv
import os
from wand.image import Image
import PyPDF2
from multiprocessing import Pool
import shutil
from subprocess import run
import json
from sqlalchemy import text, create_engine
import pandas as pd
import uuid
import platform
import camelot
import hashlib

dot_env_path = Path(r"./server/.env")
load_dotenv(dotenv_path=dot_env_path)
host = os.getenv("DB_HOST")
database = os.getenv("DB_DATABASE")
user = os.getenv("DB_USER")
password = os.getenv("DB_PASS")
engine = create_engine(f"mysql+mysqldb://{user}:{password}@{host}/{database}?charset=utf8")

converter_path = Path(r"./pdf2html.jar")
html_folder_path = Path(r"\\luxor\data\branch\Environmental Baseline Data\Web\html")
csv_tables_folder_path = Path(r"\\luxor\data\branch\Environmental Baseline Data\Web\y\csv_tables")
pdf_images_folder_path = Path(r"\\luxor\data\branch\Environmental Baseline Data\Web\pdf_images")
html_tables_folder_path = Path(r"\\luxor\data\branch\Environmental Baseline Data\Web\y\html_tables")
pdf_files_folder = Path(r"\\luxor\data\branch\Environmental Baseline Data\Web\PDF")
pdf_files = list(pdf_files_folder.glob("*.pdf"))[:]


def clean_folder(folder):
    for path in folder.glob("*"):
        if path.is_file():
            path.unlink()
        elif path.is_dir():
            shutil.rmtree(path, ignore_errors=True)


def get_table(table):
    statement = f"SELECT * FROM {table};"
    df = pd.read_sql(statement, engine)
    return df


def get_pdfs():
    print()
    print(f"Starting to insert {len(pdf_files)} PDFs to DB...")

    # for pdf_file in pdf_files:
    #     get_pdf(pdf_file)

    with Pool() as pool:
        pool.map(get_pdf, pdf_files)

    print(f"Done inserting {len(pdf_files)} PDFs")


def get_pdf(pdf):
    try:
        with engine.connect() as conn:
            statement = text(
                "INSERT INTO y_pdfs (fileId) VALUE (:file_id);")
            conn.execute(statement, {"file_id": pdf.stem})
    except Exception as e:
        print("#####################################")
        print(f"Error inserting PDF to DB for {pdf.stem}: {e}")
        print("#####################################")


def get_pages_numbers():
    print()
    df = get_table("y_pdfs")
    pdfs = df["fileId"]
    print(f"Starting to update {len(pdfs)} PDF pages numbers in DB...")

    # for pdf in pdfs:
    #     get_pages_number(pdf)

    with Pool(12) as pool:
        pool.map(get_pages_number, pdfs)

    print(f"Done {len(pdfs)} items")


def get_pages_number(file_id):
    try:
        pdf = pdf_files_folder.joinpath(f"{file_id}.pdf").open("rb")
        reader = PyPDF2.PdfFileReader(pdf)
        total_pages = reader.getNumPages()
        pdf.close()

        with engine.connect() as conn:
            stmt = text("UPDATE y_pdfs SET totalPages = :total_pages WHERE fileId = :file_id;")
            conn.execute(stmt, {"total_pages": total_pages, "file_id": file_id})
    except Exception as e:
        print("#####################################")
        print(f"Failed to process {file_id}: {e}")
        print("#####################################")


def extract_images_from_pdfs():
    print()
    print("Getting the list of PDFs from DB...")
    df = get_table("y_pdfs")
    pdfs = df.to_dict("records")
    print()
    print(f"Starting to extract images from {len(pdfs)} PDFs in DB...")

    # for pdf_file in pdfs:
    #     extract_image_from_pdf(pdf_file)

    with Pool(12) as pool:
        pool.map(extract_image_from_pdf, pdfs)

    print(f"Done {len(pdfs)} items")


def extract_image_from_pdf(pdf):
    try:
        file_id = pdf["fileId"]
        pages = pdf["totalPages"]

        pdf_file_path = pdf_files_folder.joinpath(f"{file_id}.pdf")
        pdf_file_images_folder = pdf_images_folder_path.joinpath(pdf_file_path.stem)
        if pdf_file_images_folder.exists():
            clean_folder(pdf_images_folder_path)
        else:
            pdf_file_images_folder.mkdir()

        for page in range(0, pages):
            with Image(filename=f"{pdf_file_path.resolve()}[{page}]", resolution=200) as img:
                img.format = "jpg"
                img.save(filename=pdf_file_images_folder.joinpath(f"{page + 1}.jpg"))

        print(f"Extracted {pages} images from PDF {file_id}")
    except Exception as e:
        print("#####################################")
        print(f"Failed to process {pdf['fileId']}: {e}")
        print("#####################################")


def get_words_table_from_pdfs():
    print()
    print("Getting the list of PDFs for extraction from DB...")
    df = get_table("y_pdfs")
    pdfs = df.to_dict("records")
    print()
    print(f"Cleaning up the folder {html_folder_path}...")
    clean_folder(html_folder_path)
    print()
    print(f"Starting to extract words `table` from {len(pdfs)} PDFs in DB...")

    # for pdf_file in pdfs:
    #     get_words_table_from_pdf(pdf_file)

    with Pool(12) as pool:
        pool.map(get_words_table_from_pdf, pdfs)

    print(f"Done {len(pdfs)} items")


def get_words_table_from_pdf(pdf):
    try:
        file_id = pdf["fileId"]

        file = pdf_files_folder.joinpath(f"{file_id}.pdf")

        timeout = 3600  # seconds
        arguments = ['java', "-Xmx100000M", "-d64", '-jar', str(converter_path.resolve()), str(file.resolve()),
                     str(html_folder_path.resolve())]
        if platform.system() == "Darwin":
            del arguments[2]
        run(arguments, timeout=timeout)

        current_file_folder = html_folder_path.joinpath(str(file_id))
        search_json = json.load(current_file_folder.joinpath("search.json").open(encoding="utf8"))
        pages_with_word_table = [None]

        words_sum = 0
        for page in search_json:
            if "table" in page.lower():
                pages_with_word_table.append(True)
                words_sum += 1
            else:
                pages_with_word_table.append(False)

        with engine.connect() as conn:
            stmt = text(
                "UPDATE y_pdfs SET totalPagesWithWordTable = :words_sum, pagesWithWordTable = :json" +
                " WHERE fileId = :file_id;")
            conn.execute(stmt, {"words_sum": words_sum, "file_id": file_id, "json": json.dumps(pages_with_word_table)})

        shutil.rmtree(current_file_folder, ignore_errors=True)
        print(f"Converted ID {file_id}")

    except Exception as e:
        print("#####################################")
        print(f"Failed to process {pdf['fileId']}: {e}")
        print("#####################################")


def extract_csv_tables():
    print()
    df = get_table("y_pdfs")
    pdfs = df.to_dict("records")
    print(f"Cleaning up the folder {html_tables_folder_path}...")
    clean_folder(html_tables_folder_path)
    print(f"Cleaning up the folder {csv_tables_folder_path}...")
    clean_folder(csv_tables_folder_path)
    print(f"Starting to convert {len(pdfs)} PDFs to CSVs...")

    # for pdf_object in pdfs:
    #    extract_csv_table(pdf_object)

    with Pool(12) as pool:
        pool.map(extract_csv_table, pdfs)

    print(f"Done converting {len(pdfs)} PDFs")


def extract_csv_table(pdf):
    try:
        pdf_name = pdf["fileId"]
        pdf_pages = pdf["totalPages"]
        pdf_file_path = pdf_files_folder.joinpath(f"{pdf_name}.pdf")

        def process_tables(tables, page, method):
            if len(tables) == 0:
                print(f"0 tables found with {method} for page {page} of {pdf_name}")
                return
            print(f"{len(tables)} tables found with {method} for page {page} of {pdf_name}")
            for i in range(len(tables)):
                t = tables[i]
                csv_id = str(uuid.uuid4())
                csv_file_name = csv_tables_folder_path.joinpath(f"{csv_id}.csv")
                t.to_csv(csv_file_name, index=False, header=False)
                df = pd.read_csv(csv_file_name, na_filter=False, skip_blank_lines=False, header=None, )
                df.to_html(html_tables_folder_path.joinpath(f"{csv_id}.html"), index=False, header=False,
                           encoding="utf-8-sig", na_rep=" ")
                with engine.connect() as conn:
                    statement = text(
                        "INSERT INTO y_tables (uuid, fileId, method, page, number) " +
                        "VALUE (:csv_id, :pdf_name, :method, :page, :number);")
                    conn.execute(statement,
                                 {"csv_id": csv_id, "pdf_name": pdf_name, "method": method, "page": page, "number": i})

        for current_page in range(1, pdf_pages):
            sousan_tables = camelot.read_pdf(str(pdf_file_path), pages=str(current_page), strip_text='\n',
                                             flag_size=True, copy_text=['v'], line_scale=40, flavour="stream", )
            process_tables(sousan_tables, current_page, "sousan")
            lattice_tables = camelot.read_pdf(str(pdf_file_path), pages=str(current_page), strip_text='\n',
                                              flag_size=True, flavor="lattice")
            process_tables(lattice_tables, current_page, "lattice")
            stream_tables = camelot.read_pdf(str(pdf_file_path), pages=str(current_page), strip_text='\n',
                                             flag_size=True, flavor="stream")
            process_tables(stream_tables, current_page, "stream")
            print()
    except Exception as e:
        print("#####################################")
        print(e)
        print("#####################################")


def delete_latest_tables():
    def do_work(target):
        statement = text("DELETE FROM y_tables WHERE fileId = :fileId AND page = :page")
        file_id = target["fileId"]
        page = target["page"]
        result = conn.execute(statement, {"fileId": file_id, "page": page})
        print(f"Deleted {result.rowcount} for {file_id} # {page}")

    with engine.connect() as conn:
        df = pd.read_sql("SELECT fileId, MAX(page) as page FROM y_tables GROUP BY fileId;", conn)
        maxes = df.to_dict("records")

        for item in maxes:
            do_work(item)

    print(f"Deleted last page tables")


def continue_extracting_csv_tables():
    print()

    statement = "SELECT p.fileId, p.totalPages, t.page FROM y_pdfs p " + \
                "LEFT JOIN (SELECT fileId, MAX(page) AS page FROM y_tables GROUP BY fileId) t ON p.fileId = t.fileId;"
    pdfs = pd.read_sql(statement, engine).replace({pd.np.nan: None}).to_dict("records")
    print(f"Continue to convert PDFs to CSVs...")

    # for pdf_object in pdfs:
    #    extract_csv_table(pdf_object)

    with Pool() as pool:
        pool.map(extract_csv_table, pdfs)

    print(f"Done converting PDFs")


def continue_extracting_csv_table(pdf):
    try:
        pdf_name = pdf["fileId"]
        pdf_pages = pdf["totalPages"]
        last_page = pdf["page"]
        pdf_file_path = pdf_files_folder.joinpath(f"{pdf_name}.pdf")

        def process_tables(tables, page, method):
            if len(tables) == 0:
                print(f"0 tables found with {method} for page {page} of {pdf_name}")
                return
            print(f"{len(tables)} tables found with {method} for page {page} of {pdf_name}")
            for i in range(len(tables)):
                t = tables[i]
                csv_id = str(uuid.uuid4())
                csv_file_name = csv_tables_folder_path.joinpath(f"{csv_id}.csv")
                t.to_csv(csv_file_name, index=False, header=False)
                df = pd.read_csv(csv_file_name, na_filter=False, skip_blank_lines=False, header=None, )
                df.to_html(html_tables_folder_path.joinpath(f"{csv_id}.html"), index=False, header=False,
                           encoding="utf-8-sig", na_rep=" ")
                with engine.connect() as conn:
                    statement = text(
                        "INSERT INTO y_tables (uuid, fileId, method, page, number) " +
                        "VALUE (:csv_id, :pdf_name, :method, :page, :number);")
                    conn.execute(statement,
                                 {"csv_id": csv_id, "pdf_name": pdf_name, "method": method, "page": page, "number": i})

        start = last_page + 1 if last_page is not None else 1

        for current_page in range(start, pdf_pages):
            try:
                sousan_tables = camelot.read_pdf(str(pdf_file_path), pages=str(current_page), strip_text='\n',
                                                 flag_size=True, copy_text=['v'], line_scale=40, flavour="stream", )
                process_tables(sousan_tables, current_page, "sousan")
            except Exception as e:
                print(e)
            try:
                lattice_tables = camelot.read_pdf(str(pdf_file_path), pages=str(current_page), strip_text='\n',
                                                  flag_size=True, flavor="lattice")
                process_tables(lattice_tables, current_page, "lattice")
            except Exception as e:
                print(e)
            try:
                stream_tables = camelot.read_pdf(str(pdf_file_path), pages=str(current_page), strip_text='\n',
                                                 flag_size=True, flavor="stream")
                process_tables(stream_tables, current_page, "stream")
                print()
            except Exception as e:
                print(e)
    except Exception as e:
        print("#####################################")
        print(e)
        print("#####################################")


def assign_hash_sum(record):
    table_id = record["uuid"]
    file_path = csv_tables_folder_path.joinpath(f"{table_id}.csv")
    file_hash = hashlib.md5(file_path.read_bytes()).hexdigest()
    with engine.connect() as conn:
        stmt = text("UPDATE y_tables SET hash_sum = :file_hash WHERE uuid = :table_id;")
        conn.execute(stmt, {"file_hash": file_hash, "table_id": table_id})
        print(file_hash)


def assign_hash_sums():
    df = get_table("y_tables")
    tables = df.to_dict("records")

    # for table in tables:
    #     assign_hash_sum(table)

    with Pool() as pool:
        pool.map(assign_hash_sum, tables)


def clean_file(pdf):
    pdf_id = pdf["fileId"]
    pages = pdf["totalPages"]
    query = text("DELETE FROM y_tables WHERE uuid = :uuid")
    duplicates = 0
    for current_page in range(1, pages):
        with engine.connect() as conn:
            df = pd.read_sql(text("SELECT * FROM y_tables WHERE fileId = :fileId AND page = :page;"), conn,
                             params={"fileId": pdf_id, "page": current_page})
            records = df.to_dict("records")
            hash_dict = {}
            for record in records:
                hash_sum = record["hash_sum"]
                table_id = record["uuid"]
                if hash_sum in hash_dict:
                    result = conn.execute(query, {"uuid": table_id})
                    duplicates += result.rowcount
                else:
                    hash_dict[hash_sum] = True
    print(f"Done cleaning up file {pdf_id}, deleted {duplicates} duplicates")


def cleanup_duplicates():
    with engine.connect() as conn:
        df = pd.read_sql("SELECT fileId, totalPages FROM y_pdfs;", conn)
    pdfs = df.to_dict("records")

    # for file in pdfs:
    #     clean_file(file)
        
    with Pool() as pool:
        pool.map(clean_file, pdfs)


if __name__ == "__main__":
    # get_pdfs()
    # get_pages_numbers()
    # extract_images_from_pdfs() #  Do not run as it is done in X Validation
    # get_words_table_from_pdfs()
    # extract_csv_tables()
    # delete_latest_tables()  # BE CAREFUL!!!
    # continue_extracting_csv_tables()
    # assign_hash_sums()
    cleanup_duplicates()
    pass
