import requests
import json
import pandas as pd


def get_data():
    result = []
    items_per_request = 1000  # cannot go over 1000
    skip = 0
    done = False

    while True:
        if done:
            return result

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
        received = decoded['value']
        if len(received) < items_per_request:
            done = True
        skip += items_per_request
        result += received


def get_data_dictionary():
    r = requests.request("GET", "https://species-registry.canada.ca/sar-config.json")
    data_dict = r.json()
    return data_dict['species']["en"]["columns"]


def replace_cell(prev_value, options_dict):
    to_string_for_uniformity = str(prev_value)
    if to_string_for_uniformity in options_dict:
        return options_dict[to_string_for_uniformity]
    else:
        return prev_value


def remove_tags(prev_value):
    return prev_value.replace("<i>", "").replace("</i>", "")


# ['1', '11', '12', '13', '2', '3', '4', '5', '6', '7', '8', '9']
def replace_ranges(prev_value, options_dict):
    result = []
    for numberString in prev_value:
        num = str(numberString)
        if num in options_dict:
            result.append(options_dict[num])
        else:
            result.append(num)
    return result


def apply_data_dictionary(raw_df, columns):
    for column in columns:
        name = column["name"]
        label = column["label"]
        options = column["options"]
        if name in raw_df:
            raw_df = raw_df.rename(columns={name: label})

            if label == "COSEWIC scientific name":
                raw_df[label] = raw_df[label].apply(remove_tags)

            if options:
                options_dict = {}
                for option in options:
                    key = str(option["id"])
                    value = str(option["label"])
                    options_dict[key] = value

                if label == "Range":
                    raw_df[label] = raw_df[label].apply(replace_ranges, args=(options_dict,))
                else:
                    raw_df[label] = raw_df[label].apply(replace_cell, args=(options_dict,))
    return raw_df


data = get_data()
df = pd.DataFrame(data)
pd.set_option('display.max_columns', None)
pd.set_option('display.max_colwidth', -1)
pd.set_option('display.width', 9999)

print("Headers:", df.columns.values)
print()
print("Top rows:")
print()
print(df.head(10))
print()
print("Total rows:", len(df.index))


data_dictionary = get_data_dictionary()
parsed_df = apply_data_dictionary(df, data_dictionary)

print()
print(parsed_df.head(10))

# df.to_csv("out_.csv", encoding='utf-8')
