from subprocess import run, TimeoutExpired, CalledProcessError

import camelot
import matplotlib.pyplot as plt
from pathlib import Path
import pandas as pd
from PyPDF2 import PdfFileReader, PdfFileWriter
from pathlib import Path
from glob import glob
from shutil import rmtree

pdf_files = list(Path("./pdf").glob("*.pdf"))
html_folder_path = Path("./html")
converter_path = Path("./buildvu-html-trial.jar")


def clean_folder(folder):
    for path in Path(folder).glob("**/*"):
        if path.is_file():
            path.unlink()
        elif path.is_dir():
            rmtree(path)


def change_pdf_title(pdf_file_path):
    try:
        with pdf_file_path.open('rb') as file_in:
            reader = PdfFileReader(file_in)
            metadata = reader.getDocumentInfo()
            if metadata["/Title"] != pdf_file_path.stem:
                print("Changing file:", pdf_file_path.stem)
                writer = PdfFileWriter()
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


def inject_app():
    pass


def extract_image():
    pass


def extract_csv_and_html():
    def extract(file_path, page, areas, flavor):
        input_file = PdfFileReader(file_path.open('rb'))
        size = input_file.getPage(page).mediaBox
        print(size.getWidth(), size.getHeight())
        tables = camelot.read_pdf(str(file_path), flavor=flavor, flag_size=True, table_areas=[
            areas], pages=str(page))
        tables[0].to_csv(file_path.stem + '.csv', index=False, header=False)
        tables[0].to_html(file_path.stem + '.html', index=False, header=False)
        print(tables[0].df)
        camelot.plot(tables[0], kind='contour')
        # plt.show()

    f1 = "B1-10_-_01_1313340047_TCPL_CCP_ESA_FINAL_Sec1-4_-_A3V4K8.pdf"
    extract(Path().joinpath("pdf", f1),
            29, '54,605,564,69', 'stream')

    f2 = "A78970-2_Supplemental_ESA_-_Part_1_of_3_-_A5E4Z2.pdf"
    extract(Path().joinpath("pdf", f2),
            7, '71,419,541,124', "stream")


if __name__ == "__main__":
    # change_pdf_titles()
    # convert_pdfs()
    pass
