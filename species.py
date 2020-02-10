import requests

if __name__ == "__main__":
    url = "https://ecprccsarsrch.search.windows.net/indexes/docblobidxen/docs/search?api-version=2017-11-11&="

    payload = "{\n    \"filter\": \"\",\n    \"queryType\": \"full\",\n    \"searchMode\": \"all\",\n    \"search\": \"*\",\n    \"orderby\": \"documentTypeSort asc,sortDate desc,documentCreateDate asc,documentTitleSort asc\",\n    \"count\": false,\n    \"top\": 1000,\n    \"skip\": 0,\n    \"select\": \"id,consultationEndDate,consultationStartDate,consultationActivationStatusId,documentCreateDate,documentDescription,documentTitle,documentTypeId,species,attachments,contacts,links,finalOrDelayed\"\n}"
    headers = {
        'Content-Type': 'application/json',
        'api-key': '3A1E8E87503C069448999238ABD05EE9'
    }

    response = requests.request("POST", url, headers=headers, data=payload)

    print(response.text.encode('utf8'))