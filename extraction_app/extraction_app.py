from subprocess import run, TimeoutExpired, CalledProcessError

import camelot
import matplotlib.pyplot as plt
import PyPDF2
from pathlib import Path
from shutil import rmtree
from bs4 import BeautifulSoup

pdf_files_folder = Path("./pdf")
pdf_files = list(pdf_files_folder.glob("*.pdf"))
html_folder_path = Path("./html")
index_files_paths = list(html_folder_path.rglob("**/index.html"))
results_folder_path = Path("./results")
converter_path = Path("./buildvu-html-trial.jar")
app_path = "../../process.js"


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
        if not soup.findAll('script', src=app_path):
            print(f"Adding script to {html_file}")
            script = soup.new_tag('script')
            script['src'] = app_path
            soup.body.append(script)
            with input_file.open("w", encoding='utf-8') as file:
                file.write(str(soup))
        else:
            print(f"{input_file} is all good!")


def inject_apps():
    print(f"Attempting to inject the app to {len(pdf_files)} HTML files")
    for index_file in index_files_paths:
        inject_app(index_file)
    print("Done injecting apps")


def extract_image():
    pass


def extract(pdf_file_path, page, area, flavor, uuid):
    # input_file = PyPDF2.PdfFileReader(pdf_file_path.open('rb'))
    # size = input_file.getPage(page).mediaBox
    # print(size.getWidth(), size.getHeight())
    tables = camelot.read_pdf(str(pdf_file_path), flavor=flavor, flag_size=True, table_areas=[area], pages=str(page))
    tables[0].to_csv(results_folder_path.joinpath(str(uuid) + '.csv'), index=False, header=False)
    tables[0].to_html(results_folder_path.joinpath(str(uuid) + '.html'), index=False, header=False)
    camelot.plot(tables[0], kind='contour')
    plt.show()


def extract_csv_and_html(inputs):
    print("Cleaning up the folder", results_folder_path)
    clean_folder(results_folder_path)
    print(f"Attempting to extract from {len(pdf_files)} IDs")
    for unit in inputs:
        extract(pdf_files_folder.joinpath(f'{unit["id"]}.pdf'), unit["page"], unit["area"], "stream", unit["uuid"])
    print("Done extracting")


def get_data_from_db():
    from_db = [
        [2445104, 29, "54,605,564,69", 23492374927349723947],
        [3024953, 7, "71,419,541,124", 12339457394572093745]
    ]

    return [{"id": item[0], "page": item[1], "area": item[2], "uuid": item[3]} for item in from_db]


if __name__ == "__main__":
    # change_pdf_titles()
    # convert_pdfs()
    # data = get_data_from_db()
    # extract_csv_and_html(data)
    inject_apps()

