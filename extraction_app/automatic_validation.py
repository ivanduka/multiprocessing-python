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
engine = create_engine(f"mysql+mysqldb://{user}:{password}@{host}/{database}")

converter_path = Path(r"./buildvu-html-trial.jar")
html_folder_path = Path(r"\\luxor\data\branch\Environmental Baseline Data\Web\html")
csv_tables_folder_path = Path(r"\\luxor\data\branch\Environmental Baseline Data\Version 4 - Final\CSV")
pdf_images_folder_path = Path(r"\\luxor\data\branch\Environmental Baseline Data\Web\pdf_images")
indices = Path(
    r"\\luxor\data\branch\Environmental Baseline Data\Version 4 - Final\Indices\Index 2 - PDFs for Major Projects "
    r"with ESAs.csv")
pdf_files = list(Path(r"\\luxor\data\branch\Environmental Baseline Data\Web\PDF").glob("*.pdf"))[:]


def clean_folder(folder):
    for path in folder.glob("*"):
        if path.is_file():
            path.unlink()
        elif path.is_dir():
            shutil.rmtree(path, ignore_errors=True)


def clear_table(table):
    print()
    try:
        with engine.connect() as conn:
            statement = f"DELETE FROM {table}"
            result = conn.execute(statement).rowcount
        print(f"Deleted ALL {result} rows for {table}")
    except Exception as e:
        print("#####################################")
        print(f"Error deleting all table rows for {table}: {e}")
        print("#####################################")


def get_pdfs():
    clear_table("x_pdfs")
    print()
    print(f"Starting to insert {len(pdf_files)} PDFs to DB")

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
            conn.execute(statement, {"file_id": pdf.stem}).rowcount
    except Exception as e:
        print("#####################################")
        print(f"Error inserting PDF to DB for {pdf.stem}: {e}")
        print("#####################################")


def get_extracted_csvs():
    try:
        print("Trying to populate the DB with the extracted tables")
        connection = mysql.connector.connect(user=user, password=password, host=host, database=database)
        cursor = connection.cursor()
        cursor.execute("DELETE FROM x_csvs")
        connection.commit()
        print("Done deleting the table content")

        stmt = "INSERT INTO x_csvs (project, csvName, fileId, tableName, page, tableNumber)" + \
               " VALUES (%s, %s, %s, %s, %s, %s)"
        total_rows = 0

        for project in csv_tables_folder_path.glob("*"):
            data = []
            project_name = project.stem
            for csv in project.glob("*.csv"):
                csv_name = csv.stem
                s = csv_name.split("_")
                file_id = s[0]
                table_number = s[-1]
                page_number = s[-2]
                if len(s) > 3:
                    table_name = s[1]
                else:
                    table_name = ""
                data.append((project_name, csv_name, file_id, table_name, page_number, table_number))
            cursor.executemany(stmt, data)
            total_rows += len(data)

        connection.commit()
        connection.close()
        print(f"Done inserting {total_rows} rows")
    except Exception as e:
        print("#####################################")
        print("Error populating the DB:")
        print(e)
        print("#####################################")


def convert_image(pdf_file_path):
    try:
        pdf_file_image_folder = pdf_images_folder_path.joinpath(pdf_file_path.stem)
        pdf_file_image_folder.mkdir()

        pdf = pdf_file_path.open("rb")
        reader = PyPDF2.PdfFileReader(pdf)
        pages = reader.getNumPages()
        pdf.close()

        for page in range(0, pages):
            with Image(filename=f"{pdf_file_path.resolve()}[{page}]", resolution=200) as img:
                img.format = "jpg"
                img.save(filename=pdf_file_image_folder.joinpath(f"{page + 1}.jpg"))

        engine = create_engine(f"mysql+mysqldb://{user}:{password}@{host}/{database}")
        with engine.connect() as conn:
            statement = text(
                "INSERT INTO x_pdfs (fileId, totalPages, pagesWithWordTable)" +
                " VALUE (:file_id, :total_pages, :pages_with_word_table)")
            result = conn.execute(statement, {"file_id": 62515, "total_pages": 24, "pages_with_word_table": "[]"})
            print(result.rowcount)

        print(f"Converted all {pages} images for {pdf_file_path}")
    except Exception as e:
        print("#####################################")
        print(f"Failed to process PDF {pdf_file_path}:")
        print(e)
        print("#####################################")


def convert_images():
    print(f"Cleaning up the folder {pdf_images_folder_path}")
    clean_folder(pdf_images_folder_path)
    print(f"Starting to process {len(pdf_files)} PDFs")

    # for pdf_file in pdf_files:
    #     convert_image(pdf_file)

    with Pool() as pool:
        pool.map(convert_image, pdf_files)

    print(f"Done extracting images from {len(pdf_files)} PDFs")


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

        sum = 0
        for page in search_json:
            if "table" in page.lower():
                pages_with_word_table.append(True)
                sum += 1
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
    get_pdfs()
    # get_extracted_csvs()
    # convert_pdfs()
    # convert_images()
