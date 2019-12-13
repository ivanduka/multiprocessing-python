import json
from multiprocessing import Pool
import time
from subprocess import run, TimeoutExpired, CalledProcessError, DEVNULL
from glob import glob


# Function runs a single unit of work (processing one PDF)
def do_work(args):
    debugging = False  # change to True/False to see/not see the pdf2html output/errors
    std = None if debugging else DEVNULL
    timeout = 3  # in seconds

    # pdf_name = args[2].split("\\")[-1]
    pdf_name = args[3].split("\\")[-1]
    pdf_index = args[0]
    arguments = args[1:]
    start = time.time()

    try:
        run(arguments, timeout=timeout, stderr=std, stdout=std)
    except (TimeoutExpired, CalledProcessError):
        print(f"{pdf_index}: Timed out {pdf_name} in {format(timeout / 60, '.1f')} minutes")
        return False, pdf_name

    item_duration = round(time.time() - start)
    print(f"{pdf_index} finished {pdf_name} in {format(item_duration / 60, '.1f')} minutes.")
    return True, pdf_name


def parse_results(outputs):
    success_items = set()
    timeout_items = set()
    for result in outputs:
        success, name = result
        if success:
            success_items.add(name)
        else:
            timeout_items.add(name)
    return success_items, timeout_items


def load_processed_files():
    try:
        with open("success.json", "r") as json_file:
            data = json.load(json_file)
            return set(data)
    except (IOError, json.JSONDecodeError):
        return set()


# TODO: NAME TO FULL PATH CONVERSION ON WINDOWS
def get_unprocessed_files(current_files):
    only_names = list(map(lambda pdf: pdf.split("\\")[-1], current_files))
    done_set = load_processed_files()
    all_set = set(only_names)
    remaining_set = all_set - done_set
    return remaining_set


def save_successfully_processed_files(done_pdfs):
    prev_done_set = load_processed_files()
    new_done_set = prev_done_set | done_pdfs
    print(prev_done_set)
    print(done_pdfs)
    print(new_done_set)
    with open("success.json", "w+") as json_file:
        json.dump(list(new_done_set), json_file)


# Function converts full paths to PDFs into a command line arguments for pdfToHtml executable
def create_arguments(inputs):
    args = []
    for j in range(len(inputs)):
        current_file = pdf_files[j]
        # command_line_argument = [f"{i + 1}/{len(pdf_files)}", pdf_to_html_exe, pdf_file, "--dest-dir", out_directory]
        arg = [f"{j + 1}/{len(inputs)}", pdf_to_html_exe, f"{j}", current_file]
        args.append(arg)
    return args


if __name__ == "__main__":
    # Marking the start time of the script
    start_time = time.time()

    # Path to pdfToHtml executable file
    # pdfToHtmlExe = r"C:\Users\T1Ivan\Desktop\GitHub\multiprocessing-python\pdf2htmlEX-win32-0.14.6-upx-with-poppler-data\pdf2htmlEX.exe"
    pdf_to_html_exe = r"./gopl.io"

    # Path to the folder with PDF files
    # pdf_files = glob(r"F:\Environmental Baseline Data\Version 3\Data\PDF\*.pdf")
    # pdf_files = sorted(glob(r"c:\Users\T1Ivan\Desktop\PDF\*.pdf"))[:]
    pdf_files = sorted(glob("/Users/ivand/Desktop/PDF/*.pdf"))

    # Path to the output folder where you need HTML files to be stored
    out_directory = pdf_files
    # out_directory = r"c:\Users\T1Ivan\Desktop\PDF\out"

    # Getting only files that were not successfully processed before
    unprocessed_pdf_files = get_unprocessed_files(pdf_files)

    # Converting full file paths to arguments for pdfToHtml
    work_items = create_arguments(unprocessed_pdf_files)

    print("\n###########################")
    print(f"Total PDFs: {len(pdf_files)}")
    print(f"Already done PDFs: {len(pdf_files) - len(unprocessed_pdf_files)}")
    print(f"Starting {len(unprocessed_pdf_files)} unprocessed PDFs")
    print("###########################\n")

    # Running all the work in multiprocessing mode
    with Pool() as pool:
        results = pool.map(do_work, work_items)

    # Sorting the results into two lists: successfully processed and time outed PDFs
    success_pdfs, timeout_pdfs = parse_results(results)

    # Saving successfully processed files to JSON file
    save_successfully_processed_files(success_pdfs)

    # Calculating the duration of the script run
    duration = time.time() - start_time

    print("\n###########################")
    print(f"Done {len(success_pdfs)} of {len(unprocessed_pdf_files)} PDFs in {round(duration)} seconds.")
    print(f"{len(success_pdfs)} PDFs are done: {list(success_pdfs)}")
    print(f"{len(timeout_pdfs)} PDFs timed out: {list(timeout_pdfs)}")
    print("###########################")
