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
from subprocess import run, TimeoutExpired, CalledProcessError
import tempfile
import shutil
import get_latest_filings  # MAC


def do_work(file_id):
    start = time.time()

    pdf_content = download_file(file_id)
    if not pdf_content:
        item_duration = round(time.time() - start)
        print(f'{file_id} failed download')
        return {
            "result": False,
            "file_id": file_id,
            "duration": item_duration
        }

    text_content = convert_pdf_to_json(file_id, pdf_content)
    if not text_content:
        item_duration = round(time.time() - start)
        return {
            "result": False,
            "file_id": file_id,
            "duration": item_duration
        }

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


def convert_pdf_to_json(file_id, pdf):
    timeout = 60 * 60  # in seconds

    text_files_folder = '/Users/ivand/Downloads/temp/'  # for MAC
    # text_files_folder = r'C:\Users\T1Ivan\Desktop\txt'

    with tempfile.NamedTemporaryFile(suffix='.pdf') as tf:
        tf.write(pdf)
        tf.flush()

        args = ['java', '-jar', './buildvu-html-trial.jar', tf.name, text_files_folder]

        try:
            run(args, timeout=timeout)
        except (TimeoutExpired, CalledProcessError):
            print(f"{file_id} errored")
            return False, file_id

        temp_file = Path(tf.name)
        base_dir = Path(text_files_folder).joinpath(temp_file.stem)
        source_json = base_dir.joinpath("search.json")
        target_json = base_dir.parent.joinpath(str(file_id) + ".json")
        os.replace(source_json, target_json)
        shutil.rmtree(base_dir)

    return True, file_id


def get_ids():
    conn_str = 'mssql+pyodbc://psql21cap/CS_Prod?trusted_connection=yes&driver=ODBC+Driver+17+for+SQL+Server'
    conn = create_engine(conn_str)
    query = 'SELECT DataID from DTreeCore WHERE SubType = 144'
    df = pd.read_sql(query, conn)
    print("Found file IDs:", df.shape[0])
    ids = df['DataID'].values.tolist()  # converting dataframe to list of ID's
    return ids


if __name__ == "__main__":
    id_list = get_latest_filings.get_latest_ids()  # for MAC
    # id_list = [3899019]
    # id_list = get_ids()[:]

    print(f"Got {len(id_list)} items to process")

    start_time = time.time()

    # Running all the work in a multiprocessing mode
    with Pool() as pool:
        results = pool.map(do_work, id_list)

    # Running all the work in a sequential mode
    # results = []
    # for single_id in id_list:
    #     results.append(do_work(single_id))

    duration = round(time.time() - start_time)
    print(f"Done in {duration} seconds")
