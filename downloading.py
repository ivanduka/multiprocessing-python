import requests


def download_file(url):
    r = requests.get(url)
    name_with_params = r.url.split("/")
    filename = name_with_params[len(name_with_params) - 1].split("?")[0]
    with open(filename, 'wb') as file:
        file.write(r.content)


if __name__ == "__main__":
    file_url = "https://apps.cer-rec.gc.ca/REGDOCS/File/Download/3883407"
    download_file(file_url)
