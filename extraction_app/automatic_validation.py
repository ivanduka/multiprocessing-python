from pathlib import Path
from dotenv import load_dotenv
import mysql.connector
import os
from wand.image import Image
import PyPDF2
from multiprocessing import Pool
import shutil
from subprocess import run
import json
from sqlalchemy import text, create_engine
import pandas as pd

dot_env_path = Path(r"./server/.env")
load_dotenv(dotenv_path=dot_env_path)
host = os.getenv("DB_HOST")
database = os.getenv("DB_DATABASE")
user = os.getenv("DB_USER")
password = os.getenv("DB_PASS")
engine = create_engine(f"mysql+mysqldb://{user}:{password}@{host}/{database}?charset=utf8")

converter_path = Path(r"./buildvu-html-trial.jar")
html_folder_path = Path(r"\\luxor\data\branch\Environmental Baseline Data\Web\html")
csv_tables_folder_path = Path(r"\\luxor\data\branch\Environmental Baseline Data\Version 4 - Final\CSV")
pdf_images_folder_path = Path(r"\\luxor\data\branch\Environmental Baseline Data\Web\pdf_images")
indices = Path(
    r"\\luxor\data\branch\Environmental Baseline Data\Version 4 - Final\Indices\Index 2 - PDFs for Major Projects "
    r"with ESAs.csv")
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


def clear_table(table):
    print()
    print(f"Starting to clear {table}...")
    try:
        with engine.connect() as conn:
            statement = f'DELETE FROM {table}'
            result = conn.execute(statement).rowcount
    except Exception as e:
        print("#####################################")
        print(f"Error deleting all table rows for {table}: {e}")
        print("#####################################")
    print(f"Deleted ALL {result} rows for {table}")


def get_pdfs():
    clear_table("x_pdfs")
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
                "INSERT INTO x_pdfs (fileId) VALUE (:file_id)")
            conn.execute(statement, {"file_id": pdf.stem})
    except Exception as e:
        print("#####################################")
        print(f"Error inserting PDF to DB for {pdf.stem}: {e}")
        print("#####################################")


def get_csvs():
    clear_table("x_csvs")
    print()
    project_folders = list(csv_tables_folder_path.glob("*"))
    print(f"Starting to insert {len(project_folders)} projects to DB...")

    # for project_folder in project_folders:
    #     get_csv(project_folder)

    with Pool() as pool:
        pool.map(get_csv, project_folders)

    print(f"Done inserting {len(project_folders)} projects")


def get_csv(project):
    try:
        project_name = project.stem
        csvs = list(project.glob("*.csv"))

        if len(csvs) < 1:
            print(f"No CSVs found for {project_name}")
            return

        inserts = []
        for csv in csvs:
            csv_name = csv.stem
            strings_list = csv_name.split("_")
            file_id = int(strings_list[0])
            table_number = int(strings_list[-1])
            page_number = int(strings_list[-2])
            table_name = strings_list[1] if len(strings_list) > 3 else ""
            inserts.append(
                {"project_name": project_name, "csv_name": csv_name, "file_id": file_id, "table_name": table_name,
                 "page_number": page_number, "table_number": table_number})

        with engine.connect() as conn:
            stmt = text("INSERT INTO x_csvs (project, csvName, fileId, tableName, page, tableNumber)" +
                        " VALUES (:project_name, :csv_name, :file_id, :table_name, :page_number, :table_number)")
            row_count = conn.execute(stmt, inserts).rowcount
        print(f"Inserted {row_count} rows for project {project_name}")

    except Exception as e:
        print("#####################################")
        print(f"Error inserting CSVs to DB for {project.stem}: {e}")
        print("#####################################")


def get_pages_numbers():
    print()
    df = get_table("x_pdfs")
    pdfs = df["fileId"]
    print(f"Starting to update {len(pdfs)} PDF pages numbers in DB...")

    # for pdf in pdfs:
    #     get_pages_number(pdf)

    with Pool() as pool:
        pool.map(get_pages_number, pdfs)

    print(f"Done {len(pdfs)} items")


def get_pages_number(file_id):
    try:
        pdf = pdf_files_folder.joinpath(f"{file_id}.pdf").open("rb")
        reader = PyPDF2.PdfFileReader(pdf)
        total_pages = reader.getNumPages()
        pdf.close()

        with engine.connect() as conn:
            stmt = text("UPDATE x_pdfs SET totalPages = :total_pages WHERE fileId = :file_id;")
            conn.execute(stmt, {"total_pages": total_pages, "file_id": file_id})
    except Exception as e:
        print("#####################################")
        print(f"Failed to process {file_id}: {e}")
        print("#####################################")


def extract_images_from_pdfs():
    print()
    print("Getting the list of PDFs from DB...")
    print()
    df = get_table("x_pdfs")
    pdfs = list(df.itertuples())
    print(f"Cleaning up the folder {pdf_images_folder_path}...")
    clean_folder(pdf_images_folder_path)
    print()
    print(f"Starting to extract images from {len(pdfs)} PDFs in DB...")

    for pdf_file in pdfs:
        extract_image_from_pdf(pdf_file)

    # with Pool() as pool:
    #    pool.map(get_image, pdfs)

    print(f"Done {len(pdfs)} items")


def extract_image_from_pdf(pdf):
    try:
        pages = pdf.totalPages
        file_id = pdf.fileId
        pdf_file_path = pdf_files_folder.joinpath(f"{file_id}.pdf")
        pdf_file_images_folder = pdf_images_folder_path.joinpath(pdf_file_path.stem)
        pdf_file_images_folder.mkdir()

        for page in range(0, pages):
            with Image(filename=f"{pdf_file_path.resolve()}[{page}]", resolution=200) as img:
                img.format = "jpg"
                img.save(filename=pdf_file_images_folder.joinpath(f"{page + 1}.jpg"))

        with engine.connect() as conn:
            stmt = text("UPDATE x_pdfs SET extractedImages = :pages WHERE fileId = :file_id;")
            conn.execute(stmt, {"pages": pages, "file_id": file_id})
        print(f"Extracted {pages} images from PDF {file_id}")
    except Exception as e:
        print("#####################################")
        print(f"Failed to process {pdf}: {e}")
        print("#####################################")


def convert_pdf(file):
    try:
        pdf = file.open("rb")
        reader = PyPDF2.PdfFileReader(pdf)
        total_pages = reader.getNumPages()
        pdf.close()

        timeout = 3600  # seconds
        arguments = ['java', "-Xmx100000M", "-d64", '-jar', str(converter_path.resolve()), str(file.resolve()),
                     str(html_folder_path.resolve())]
        run(arguments, timeout=timeout)

        current_file_folder = html_folder_path.joinpath(file.stem)
        search_json = json.load(current_file_folder.joinpath("search.json").open(encoding="utf8"))
        pages_with_word_table = [None]

        words_sum = 0
        for page in search_json:
            if "table" in page.lower():
                pages_with_word_table.append(True)
                words_sum += 1
            else:
                pages_with_word_table.append(False)

        connection = mysql.connector.connect(user=user, password=password, host=host, database=database)
        cursor = connection.cursor()
        stmt = "INSERT INTO x_pdfs (fileId, totalPages, pagesWithWordTable) VALUE (%s, %s, %s)"
        cursor.execute(stmt, (file.stem, total_pages, json.dumps(pages_with_word_table)))
        connection.commit()

        shutil.rmtree(current_file_folder, ignore_errors=True)

        print(f"Converted ID {file.stem}")
    except Exception as e:
        print("#####################################")
        print(f"Failed to process PDF {file}:")
        print(e)
        print("#####################################")


def convert_pdfs():
    print(f"Starting to process {len(pdf_files)} PDFs")
    clean_folder(html_folder_path)

    # for pdf_file in pdf_files:
    #     convert_pdf(pdf_file)

    with Pool() as pool:
        pool.map(convert_pdf, pdf_files)

    print(f"Done converting {len(pdf_files)} PDFs")


if __name__ == "__main__":
    # get_pdfs()
    # get_csvs()
    # get_pages_numbers()
    extract_images_from_pdfs()
