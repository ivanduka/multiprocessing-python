from subprocess import run, TimeoutExpired, CalledProcessError

import camelot
import matplotlib.pyplot as plt
import PyPDF2
from pathlib import Path
from shutil import rmtree
from bs4 import BeautifulSoup
import pandas as pd
from dotenv import load_dotenv
import os
from sqlalchemy import create_engine
from wand.image import Image

converter_path = Path("./buildvu-html-trial.jar")
dot_env_path = Path("./server/.env")

pdf_files_folder = Path("./pdf")
html_folder_path = Path("./server/html")
csv_tables_folder_path = Path("./server/csv_tables")
html_tables_folder_path = Path("./server/html_tables")
jpg_tables_folder_path = Path("./server/jpg_tables")
pdf_files = list(pdf_files_folder.glob("*.pdf"))
index_files_paths = list(html_folder_path.rglob("**/index.html"))

load_dotenv(dotenv_path=dot_env_path)
host = os.getenv("DB_HOST")
database = os.getenv("DB_DATABASE")
user = os.getenv("DB_USER")
password = os.getenv("DB_PASS")


def clean_folder(folder):
    for path in Path(folder).glob("**/*"):
        if path.is_file():
            path.unlink()
        elif path.is_dir():
            rmtree(path)


def change_pdf_title(pdf_file_path):
    try:
        with pdf_file_path.open('rb') as file_in:
            reader = PyPDF2.PdfFileReader(file_in)
            metadata = reader.getDocumentInfo()
            if metadata["/Title"] != pdf_file_path.stem:
                print("Changing file:", pdf_file_path.stem)
                writer = PyPDF2.PdfFileWriter()
                writer.appendPagesFromReader(reader)
                writer.addMetadata(metadata)
                writer.addMetadata({
                    "/Title": pdf_file_path.stem
                })
                with pdf_file_path.open('ab') as file_out:
                    writer.write(file_out)
            else:
                print("Title is already OK for", pdf_file_path.stem)
    except Exception as e:
        print(f"==== Error changing title in: {pdf_file_path.stem}======")
        print(e)
        print(f"======================================")


# Function changes Title property of a PDF to the file name (which is the pdf ID)
def change_pdf_titles():
    print(f"Attempting to change titles in {len(pdf_files)} PDFs")
    for pdf_file in pdf_files:
        change_pdf_title(pdf_file)
    print("Done changing titles")


def convert_pdf(pdf_file_path):
    timeout = 3600  # seconds
    arguments = ['java', '-jar', str(converter_path.resolve()), str(pdf_file_path.resolve()),
                 str(html_folder_path.resolve())]

    try:
        run(arguments, timeout=timeout)
    except (TimeoutExpired, CalledProcessError) as e:
        print(f"==== Error converting ID {pdf_file_path.stem} to HTML ======")
        print(e)
        print(f"======================================")
        return
    print(f"Converted ID {pdf_file_path.stem}")


def convert_pdfs():
    print("Cleaning up the folder", html_folder_path)
    clean_folder(html_folder_path)
    print(f"Attempting to convert {len(pdf_files)} PDFs to HTML")
    for pdf_file in pdf_files:
        convert_pdf(pdf_file)
    print("Done converting PDFs")


def inject_app(input_file):
    with input_file.open() as html_file:
        soup = BeautifulSoup(html_file, "html.parser")
        app_path = "/app.jsx"  # path
        if not soup.findAll('script', src=app_path):
            print(f"Adding scripts and CSS to {html_file}")

            div = soup.new_tag("div")
            div["id"] = "root"
            soup.find('div', id="idrviewer").insert_before(div)

            for link in soup.find_all("link"):
                if link['href'] == "https://maxcdn.bootstrapcdn.com/font-awesome/4.6.1/css/font-awesome.min.css":
                    link.decompose()

            scripts = ["/react.production.min.js", "/react-dom.production.min.js", "/babel.min.js"]  # path
            for href in scripts:
                script = soup.new_tag('script')
                script['src'] = href
                soup.body.append(script)

            script = soup.new_tag('script')
            script['src'] = app_path
            script['type'] = "text/babel"
            soup.body.append(script)

            link = soup.new_tag("link")
            link['href'] = "/app.css"  # path
            link['rel'] = 'stylesheet'
            link['type'] = "text/css"
            soup.body.append(link)

            link2 = soup.new_tag("link")
            link2['href'] = "/fontawesome-free-5.12.1-web/css/all.css"  # path
            link2['rel'] = 'stylesheet'
            link2['type'] = "text/css"
            soup.head.append(link2)

            with input_file.open("w", encoding='utf-8') as file:
                file.write(str(soup))
        else:
            print(f"{input_file} is all good!")


def inject_apps():
    print(f"Attempting to inject the app to {len(pdf_files)} HTML files")
    for index_file in index_files_paths:
        inject_app(index_file)
    print("Done injecting apps")


def populate_coordinate(table):
    print(f"Populating coordinates for table ID {table.uuid}")
    try:
        pdf_file_path = pdf_files_folder.joinpath(f"{table.fileId}.pdf")
        input_file = PyPDF2.PdfFileReader(pdf_file_path.open('rb'))
        size = input_file.getPage(table.page).mediaBox
        pdf_width = size.getWidth()
        pdf_height = size.getHeight()
        x1 = table.x1 * pdf_width / table.pageWidth
        x2 = table.x2 * pdf_width / table.pageWidth
        y1 = table.y1 * pdf_height / table.pageHeight
        y2 = table.y2 * pdf_height / table.pageHeight

        connection = create_engine(f"mysql+mysqldb://{user}:{password}@{host}/{database}")
        query = f"UPDATE extraction_app.pdf_tables SET pdfWidth={pdf_width}, pdfHeight={pdf_height}, pdfX1={x1}," \
                f" pdfX2={x2}, pdfY1={y1}, pdfY2={y2} WHERE (uuid='{table.uuid}');"
        connection.execute(query)
    except Exception as e:
        print(f"==== Error for ID {table.uuid}  ======")
        print(e)
        print(f"======================================")
        return
    print(f"Populated coordinates for table ID {table.uuid}")


def populate_coordinates():
    tables = get_data_from_db()
    print(f"Attempting to populate {len(tables)} tables' coordinates")
    for table in tables.itertuples():
        populate_coordinate(table)
    print("Done populating coordinates")


def extract_images():
    tables = get_data_from_db()
    print("Cleaning up the folder", jpg_tables_folder_path)
    clean_folder(jpg_tables_folder_path)
    print(f"Attempting to extract {len(tables)} images")
    for table in tables.itertuples():
        extract_image(table)
    print("Done extracting images")


def extract_image(table):
    print(f"Extracting table ID {table.uuid} to image")
    try:
        pdf_file_path = pdf_files_folder.joinpath(f"{table.fileId}.pdf")
        with Image(filename=f"{pdf_file_path.resolve()}[{table.page - 1}]", resolution=300) as img:
            left = int(table.pdfX1 * img.width / table.pdfWidth)
            top = int((table.pdfHeight - table.pdfY1) * img.height / table.pdfHeight)
            right = int(table.pdfX2 * img.width / table.pdfWidth)
            bottom = int((table.pdfHeight - table.pdfY2) * img.height / table.pdfHeight)
            img.crop(left=left, top=top, right=right, bottom=bottom)
            img.format = "jpg"
            img.save(filename=jpg_tables_folder_path.joinpath(f"{table.uuid}.jpg"))
    except Exception as e:
        print(f"==== Error extracting table ID {table.uuid}  ======")
        print(e)
        print(f"======================================")
        return
    print(f"Extracted table ID {table.uuid} to image")


def extract_table(table):
    print(f"Extracting table ID {table.uuid}")
    try:
        pdf_file_path = pdf_files_folder.joinpath(f"{table.fileId}.pdf")
        table_areas = [f"{table.pdfX1},{table.pdfY1},{table.pdfX2},{table.pdfY2}"]
        tables = camelot.read_pdf(str(pdf_file_path), flavor="stream", table_areas=table_areas,
                                  pages=str(table.page))
        tables[0].to_csv(csv_tables_folder_path.joinpath(f"{table.uuid}.csv"), index=False, header=False)
        tables[0].to_html(html_tables_folder_path.joinpath(f"{table.uuid}.html"), index=False, header=False)
        camelot.plot(tables[0], kind='contour')
        plt.show()
    except Exception as e:
        print(f"==== Error extracting table ID {table.uuid}  ======")
        print(e)
        print(f"======================================")
        return
    print(f"Extracted table ID {table.uuid}")


def extract_tables():
    tables = get_data_from_db()
    print("Cleaning up the folder", csv_tables_folder_path)
    clean_folder(csv_tables_folder_path)
    print("Cleaning up the folder", html_tables_folder_path)
    clean_folder(html_tables_folder_path)
    print(f"Attempting to extract {len(tables)} tables")
    for table in tables.itertuples():
        extract_table(table)
    print("Done extracting tables")


def get_data_from_db():
    connection = create_engine(f"mysql+mysqldb://{user}:{password}@{host}/{database}")
    query = "SELECT * FROM extraction_app.pdf_tables;"
    data_frame = pd.read_sql(query, con=connection)
    return data_frame


def phase_one_preparation():
    change_pdf_titles()
    convert_pdfs()
    inject_apps()


def phase_two_extraction_and_validation:
    populate_coordinates()
    extract_tables()
    extract_images()

if __name__ == "__main__":
    # phase_one_preparation();
    phase_two_extraction_and_validation()
