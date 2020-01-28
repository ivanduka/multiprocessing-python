import json
from glob import glob
from pathlib import Path
import os

# Path to results folder:
text_files_folder = Path(r'C:\Users\T1Ivan\Desktop\txt')

if __name__ == "__main__":
    pdf_files = glob(f"{text_files_folder}/*.json")[:]
    result = {}
    failed_counter = 0
    empty_counter = 0
    failed_list = []
    for pdf in pdf_files:
        name = int(Path(pdf).stem)

        if os.path.getsize(pdf) == 0:
            empty_counter += 1
            continue

        with open(pdf, encoding="utf8") as f:
            try:
                json_data = json.load(f)
                result[name] = json_data
            except Exception as e:
                failed_counter += 1
                failed_list.append(name)
                print(f"ERROR FOR {name}: {e}")

    print(f"Total: {len(pdf_files)}")
    print(f"Skipped: {empty_counter}")
    print(f"Processed: {len(result)}")
    print(f"Bad items: {failed_counter}")
    print(f"List of bad items: {failed_list}")
