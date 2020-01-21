import os
from glob import glob
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

# Path to results folder:
text_files_folder = Path(r'C:\Users\T1Ivan\Desktop\txt')


def do_work(file_id):
    start = time.time()

    pdf_content = download_file(file_id)
    if not pdf_content:
        create_dummy_json(file_id)
        return {file_id: {"result": "Download failed"}}

    metadata = convert_pdf_to_json(file_id, pdf_content)
    if not metadata:
        return {file_id: {"result": "Processing failed"}}

    item_duration = round(time.time() - start)
    print("Processed", file_id, "in", item_duration, "seconds")

    return {
        file_id: {"result": "Success", "metadata": metadata}
    }


def create_dummy_json(file_id):
    temp_file_path = text_files_folder.joinpath(f"{file_id}.json")
    with open(temp_file_path, 'w') as document:
        pass


def download_file(file_id):
    url = f'https://apps.cer-rec.gc.ca/REGDOCS/File/Download/{file_id}'
    with requests.Session() as session:
        r = session.get(url)
        content_type = r.headers["Content-Type"]
        if content_type == 'application/pdf':
            print(f"Downloaded ID {file_id} (size {len(r.content)})")
            return r.content
        else:
            print(f"Failed downloading ID {file_id}: {r.status_code} - {content_type}")
            return None


def convert_pdf_to_json(file_id, pdf):
    timeout = 60 * 20  # in seconds
    jar_file_path = Path(__file__).parent.joinpath("buildvu-html-trial.jar")

    temp_file_path = text_files_folder.joinpath(f"{file_id}.pdf")
    with open(temp_file_path, "x+b") as tf:
        tf.write(pdf)
        tf.flush()

        try:
            read_pdf = PdfFileReader(tf)
            document_info = read_pdf.getDocumentInfo()
            document_pages = read_pdf.getNumPages()
            document_xmp_metadata = read_pdf.getXmpMetadata()
        except Exception:
            read_pdf = None
            document_info = None
            document_pages = None
            document_xmp_metadata = None

    document_size = os.path.getsize(temp_file_path)

    args = ['java', "-DsocksProxyHost=socks.example.com", "-Xmx2000M", "-d64", '-jar', f"{jar_file_path}",
            f'{temp_file_path}', f'{text_files_folder}', ]

    base_dir = text_files_folder.joinpath(temp_file_path.stem)
    source_json = base_dir.joinpath("search.json")
    target_json = base_dir.parent.joinpath(str(file_id) + ".json")

    try:
        run(args, timeout=timeout)
    except Exception:
        print(f'Failed to process ID {file_id}')
        if base_dir.exists():
            shutil.rmtree(base_dir)
        os.remove(temp_file_path)
        return None

    if source_json.exists():
        os.replace(source_json, target_json)

    if base_dir.exists():
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
    print(f"DB returned {df.shape[0]} IDs")
    ids = df['DataID'].values.tolist()  # converting dataframe to list of ID's
    return ids


def remove_processed(all_ids):
    pdf_files = glob(f"{text_files_folder}/*.json")

    processed_ids = set([])
    for pdf_file in pdf_files:
        processed_ids.add(int(Path(pdf_file).stem))

    new_ids = []
    for next_id in all_ids:
        if next_id not in processed_ids:
            new_ids.append(next_id)

    return new_ids


def cleanup_folders_and_pdfs():
    pdf_files = glob(f"{text_files_folder}/*.pdf")
    folders = os.listdir(text_files_folder)

    print(f"Cleaning up pdf files and folders")

    for pdf in pdf_files:
        os.remove(pdf)

    for folder in folders:
        full_path = text_files_folder.joinpath(folder)
        if os.path.isdir(full_path):
            shutil.rmtree(full_path)


if __name__ == "__main__":
    cleanup_folders_and_pdfs()

    ids_from_db = get_ids()[:]
    ids_for_processing = remove_processed(ids_from_db)

    print(f"Skipping {len(ids_from_db) - len(ids_for_processing)} items (already processed)")
    print(f"Starting to work on {len(ids_for_processing)} items")

    start_time = time.time()

    # Running all the work in a multiprocessing mode
    # with Pool() as pool:
    #     results = pool.map(do_work, ids_for_processing)

    # Running all the work in a sequential mode
    results = []
    for single_id in ids_for_processing:
        results.append(do_work(single_id))

    # with open('report.json', 'w') as f:
    #     json.dump(results, f, indent=2)

    duration = round(time.time() - start_time)
    print(f"Done in {duration} seconds")
