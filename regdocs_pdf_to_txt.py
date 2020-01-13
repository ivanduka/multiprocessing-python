import os
from multiprocessing import Pool
import time
import tika
from tika import parser  # need Java update
from sqlalchemy import create_engine
import pandas as pd
import re
import requests
from pathlib import Path


def do_work(file_id):
    start = time.time()

    pdf_content = download_file(file_id)
    if not pdf_content:
        item_duration = round(time.time() - start)
        return {
            "result": False,
            "file_id": file_id,
            "duration": item_duration
        }

    text_content = convert_pdf_to_text(pdf_content)
    if not text_content:
        item_duration = round(time.time() - start)
        return {
            "result": False,
            "file_id": file_id,
            "duration": item_duration
        }

    processed_text = process_text(text_content)
    save_file(file_id, processed_text)
    item_duration = round(time.time() - start)
    print(True, file_id, item_duration, "seconds")
    return {
        "result": True,
        "file_id": file_id,
        "duration": item_duration
    }


def download_file(file_id):
    url = f'https://apps.cer-rec.gc.ca/REGDOCS/File/Download/{file_id}'
    with requests.Session() as session:
        r = session.get(url)
        if r.status_code != 200:
            print("Got not 200:", r.status_code)
        if r.headers["Content-Type"] == 'application/pdf':
            return r.content
        else:
            return False


def process_text(input_text):
    return input_text


def save_file(file_id, text):
    text_files_folder = r'C:\Users\T1Ivan\Desktop\txt'
    full_path = Path(text_files_folder).joinpath(f'{file_id}.txt')
    with open(full_path, "wb") as file:
        file.write(text.encode('utf-8', 'ignore'))


def convert_pdf_to_text(pdf):
    parsed = parser.from_buffer(pdf)
    content = parsed["content"]
    if not content:
        return False
    return content


def get_ids():
    conn_str = 'mssql+pyodbc://psql21cap/CS_Prod?trusted_connection=yes&driver=ODBC+Driver+17+for+SQL+Server'
    conn = create_engine(conn_str)
    query = 'SELECT DataID from DTreeCore WHERE SubType = 144'
    df = pd.read_sql(query, conn)
    print("Found file IDs:", df.shape[0])
    ids = df['DataID'].values.tolist()  # converting dataframe to list of ID's
    return ids


if __name__ == "__main__":
    start_time = time.time()
    id_list = get_ids()[:]

    # Running all the work in a multiprocessing mode
    with Pool(24) as pool:
        results = pool.map(do_work, id_list)

    # Running all the work in a sequential mode
    # results = []
    # for single_id in id_list:
    #     results.append(do_work(single_id))

    duration = round(time.time() - start_time)
    print(f"Done in {duration} seconds")
