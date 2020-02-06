from glob import glob
from pathlib import Path
import pandas
import requests
import multiprocessing
from subprocess import run, TimeoutExpired, CalledProcessError

# Variables for running this app
pdf_ids = Path(r"F:\Environmental Baseline Data\Web\v01\ESA Figures.xlsx")
pdf_files = Path(r"F:\Environmental Baseline Data\Web\v01\pdfs")
html_files = Path(r"F:\Environmental Baseline Data\Web\v01\html")


def convert_pdf(file_id):
    timeout = 1 * 60 * 60  # in seconds
    pdf_path = pdf_files.joinpath(str(file_id)).with_suffix(".pdf")
    arguments = ['java', "-Xmx24000M", "-d64", '-jar',
                 "./buildvu-html-trial.jar", str(pdf_path), str(html_files)]

    try:
        run(arguments, timeout=timeout, shell=True)
    except (TimeoutExpired, CalledProcessError) as e:
        print(f"==== Error processing ID: {file_id}======")
        print(e)
        print(f"======================================")
        return
    print(f"Converted ID {file_id}")


def check_existing_pdfs(ids_from_excel):
    existing_pdfs = [int(Path(pdf).stem) for pdf in glob(f"{pdf_files}\\*.pdf")]
    new_ids = []
    for pdf_from_excel in ids_from_excel:
        if pdf_from_excel not in existing_pdfs:
            new_ids.append(pdf_from_excel)
    return new_ids


def get_ids():
    excel_data_frame = pandas.read_excel(pdf_ids)
    return excel_data_frame["DataID"].unique()


def download_id(file_id):
    download_url = f'http://docs2.cer-rec.gc.ca/ll-eng/llisapi.dll?func=ll&objId={file_id}&objaction=download&viewType=1'
    r = requests.get(download_url)
    with open(pdf_files.joinpath(str(file_id)).with_suffix(".pdf"), 'wb') as file:
        file.write(r.content)


if __name__ == "__main__":
    ids = get_ids()
    print(f"Need to process {len(ids)} ids")

    ids_to_download = check_existing_pdfs(ids)
    print(f"Already have {len(ids) - len(ids_to_download)} ids")
    print(f"Downloading {len(ids_to_download)} ids")
    # for pdf_id in ids_to_download:
    #     download_id(pdf_id)
    with multiprocessing.Pool() as pool:
        pool.map(download_id, ids_to_download)
    print(f"Downloaded {len(ids_to_download)} IDs")

    print("Commencing the conversion:")
    # for pdf_id in ids:
    #     convert_pdf(pdf_id)
    with multiprocessing.Pool(6) as pool:
        pool.map(convert_pdf, ids)
    print(f"Converted all ids")
