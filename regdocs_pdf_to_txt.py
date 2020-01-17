import os
from multiprocessing import Pool
import time
from sqlalchemy import create_engine
import pandas as pd
import requests
from pathlib import Path
from subprocess import run, TimeoutExpired, CalledProcessError
import shutil
import json
from PyPDF2 import PdfFileReader


def do_work(file_id):
    start = time.time()

    pdf_content = download_file(file_id)
    if not pdf_content:
        print(f'{file_id} failed download')
        return {file_id: {"result": "Download failed"}}

    metadata = convert_pdf_to_json(file_id, pdf_content)
    if not metadata:
        return {file_id: {"result": "Processing failed"}}

    item_duration = round(time.time() - start)
    print("Done", file_id, "in", item_duration, "seconds")

    return {
        file_id: {"result": "Success", "metadata": metadata}
    }


def download_file(file_id):
    url = f'https://apps.cer-rec.gc.ca/REGDOCS/File/Download/{file_id}'
    with requests.Session() as session:
        r = session.get(url)
        if r.headers["Content-Type"] == 'application/pdf':
            print(f"Downloaded PDF for {file_id}")
            return r.content
        else:
            return None


def convert_pdf_to_json(file_id, pdf):
    timeout = 60 * 60  # in seconds
    jar_file_path = Path(__file__).parent.joinpath("buildvu-html-trial.jar")

    # Path to results folder:
    text_files_folder = Path(r'C:\Users\T1Ivan\Desktop\txt').joinpath("")

    temp_file_path = text_files_folder.joinpath(f"{file_id}.pdf")
    with open(temp_file_path, "x+b") as tf:
        tf.write(pdf)
        tf.flush()
        read_pdf = PdfFileReader(tf)
        document_info = read_pdf.getDocumentInfo()
        document_pages = read_pdf.getNumPages()
        document_xmp_metadata = read_pdf.getXmpMetadata()

    document_size = os.path.getsize(temp_file_path)

    args = ['java', '-jar', f'{jar_file_path}',
            f'{temp_file_path}', f'{text_files_folder}', ]

    try:
        run(args, timeout=timeout)
    except (TimeoutExpired, CalledProcessError):
        print(f"File with ID {file_id} could not be processed")
        return None

    base_dir = text_files_folder.joinpath(temp_file_path.stem)
    source_json = base_dir.joinpath("search.json")
    target_json = base_dir.parent.joinpath(str(file_id) + ".json")
    os.replace(source_json, target_json)
    shutil.rmtree(base_dir)
    os.remove(temp_file_path)

    return {
        "document_info": document_info,
        "document_pages": document_pages,
        "document_xmp_metadata": document_xmp_metadata,
        "document_size": document_size,
    }


def get_ids():
    conn_str = 'mssql+pyodbc://psql21cap/CS_Prod?trusted_connection=yes&driver=ODBC+Driver+17+for+SQL+Server'
    conn = create_engine(conn_str)
    query = 'SELECT DataID from DTreeCore WHERE SubType = 144'
    df = pd.read_sql(query, conn)
    print("Found file IDs:", df.shape[0])
    ids = df['DataID'].values.tolist()  # converting dataframe to list of ID's
    return ids


if __name__ == "__main__":
    id_list = get_ids()[1000:1002]

    print(f"Got {len(id_list)} items to process")

    start_time = time.time()

    # Running all the work in a multiprocessing mode
    with Pool() as pool:
        results = pool.map(do_work, id_list)

    # Running all the work in a sequential mode
    # results = []
    # for single_id in id_list:
    #     results.append(do_work(single_id))

    with open('report.json', 'w') as f:
        json.dump(results, f, indent=2)

    duration = round(time.time() - start_time)
    print(json.dumps(results, indent=2))
    print(f"Done in {duration} seconds")
