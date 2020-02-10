import requests
import json
import pandas as pd


def get_data_provider():
    items_per_request = 1000  # cannot go over 1000
    skip = 0
    done = False

    def get_data():
        nonlocal skip
        nonlocal done
        if done:
            return False

        url = "https://ecprccsarsrch.search.windows.net/indexes/speblobidxen/docs/search?api-version=2017-11-11&="

        payload = "{\n    \"filter\": \"\",\n    \"queryType\": \"full\",\n    \"searchMode\": \"all\"," \
                  "\n    \"search\": \"*\",\n    \"orderby\": \"commonNameSort asc,taxonomySort asc\"," \
                  "\n    \"count\": false,\n    \"top\": %s,\n    \"skip\": %s,\n    \"select\": \"id," \
                  "legalStatusId,cosewicStatusId,legalCommonName,cosewicCommonName,cosewicScientificName," \
                  "legalScientificName,legalPopulation,cosewicPopulation,taxonomyId,emergencyAssessment," \
                  "cosewicLastAssessmentDate,imageFileName,legalDateListing,legalScheduleId,underConsiderationId," \
                  "ranges\"\n}" % (items_per_request, skip)

        headers = {'Content-Type': 'application/json', 'api-key': '3A1E8E87503C069448999238ABD05EE9'}
        response = requests.request("POST", url, headers=headers, data=payload)
        decoded = json.loads(response.text)
        result = decoded['value']
        if len(result) < items_per_request:
            done = True
        skip += items_per_request
        return result

    return get_data


if __name__ == "__main__":
    dp = get_data_provider()
    data = []
    while True:
        chunk = dp()
        if not chunk:
            break
        data += chunk

    df = pd.DataFrame(data)
    print("Headers:", df.columns.values)
    print("Top rows:")
    print(df.head())
    print("Total rows:", len(df.index))
    # df.to_csv("out.csv", encoding='utf-8')
