import requests
import os
import re
from urllib.parse import unquote


def download_file(view_url, save_folder):
    file_id = view_url.split("/")[-1]
    download_url = f'http://docs2.cer-rec.gc.ca/ll-eng/llisapi.dll?func=ll&objId={file_id}&objaction=download&viewType=1'
    r = requests.get(download_url)
    content_disposition = r.headers['content-disposition']
    url_encoded_name = re.findall("filename=(.+)", content_disposition)[0].replace('"', '')
    file_name = unquote(url_encoded_name)
    full_name = os.path.join(save_folder, file_name)
    with open(full_name, 'wb') as file:
        file.write(r.content)


if __name__ == "__main__":
    save_folder = r'C:\Users\T1Ivan\Desktop\test'
    file_url = "https://apps.cer-rec.gc.ca/REGDOCS/File/Download/3883407"
    download_file(file_url, save_folder)
