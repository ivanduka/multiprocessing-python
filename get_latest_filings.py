import time

import requests
from bs4 import BeautifulSoup
from multiprocessing import Pool


def _get_latest_filings():
    url = "https://apps.cer-rec.gc.ca/REGDOCS/Search/SearchFilings?p=1&sr=1"
    r = requests.get(url)
    soup = BeautifulSoup(r.content, 'html.parser')
    result = []
    for link in soup.find_all('a'):
        result.append(int(link.get('href').split("/")[-1]))
    return result


def get_single_id(filing_id):
    result = []
    r = requests.get(f"https://apps.cer-rec.gc.ca/REGDOCS/Item/LoadResult/{filing_id}")
    soup = BeautifulSoup(r.content, 'html.parser')
    all_anchors = soup.find_all('a')
    for link in all_anchors:
        href = link.get('href')
        if href.startswith("/REGDOCS/File/Download/"):
            result.append(int(href.split("/")[-1]))
    return result


def get_latest_ids():
    start_time = time.time()

    filings = _get_latest_filings()

    with Pool() as pool:
        result = pool.map(get_single_id, filings)

    # result = []
    # for filing in filings:
    #     result.append(get_single_id(filing))

    flattened = sum(result, [])
    duration = round(time.time() - start_time)
    print(f"Got {len(result)} IDs in {duration} seconds")
    return flattened


if __name__ == "__main__":
    get_latest_ids()
