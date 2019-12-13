import json
from multiprocessing import Pool
import time
from subprocess import run, TimeoutExpired, CalledProcessError, DEVNULL
from glob import glob


def do_work(args):
    debugging = False  # change to True/False to see/not see the pdf2html output/errors
    std = None if debugging else DEVNULL
    timeout = 5  # in seconds

    pdf_name = args[2].split("\\")[-1]
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


def get_unprocessed_files(current_files):
    try:
        with open("success.json", "r+") as json_file:
            data = json.load(json_file)
            done_set = set(data)
            all_set = set(current_files)
            remaining_set = all_set - done_set
            return list(remaining_set)
    except IOError:
        return current_files


if __name__ == "__main__":
    pdfToHtmlExe = r"C:\Users\T1Ivan\Desktop\GitHub\multiprocessing-python\pdf2htmlEX-win32-0.14.6-upx-with-poppler-data\pdf2htmlEX.exe"
    pdf_files = sorted(glob(r"c:\Users\T1Ivan\Desktop\PDF\*.pdf"))[:]
    # pdf_files = glob(r"F:\Environmental Baseline Data\Version 3\Data\PDF\*.pdf")
    out_directory = r"c:\Users\T1Ivan\Desktop\PDF\out"

    pdf_path = pdf_files[0].split
    unprocessed_pdf_files = get_unprocessed_files(pdf_files)

    work_items = []
    for i in range(len(pdf_files)):
        pdf_file = pdf_files[i]
        command_line_argument = [f"{i}/{len(pdf_files)}", pdfToHtmlExe, pdf_file, "--dest-dir", out_directory]
        work_items.append(command_line_argument)

    start_time = time.time()
    print("\n###########################")
    print(f"Starting {len(work_items)} PDFs")
    print("###########################\n")

    with Pool() as pool:
        results = pool.map(do_work, work_items)

    duration = time.time() - start_time

    success_pdfs, timeout_pdfs = parse_results(results)

    print("\n###########################")
    print(f"Done {len(success_pdfs)} of {len(work_items)} PDFs in {round(duration)} seconds.")
    print(f"{len(success_pdfs)} PDFs are done: {success_pdfs}")
    print(f"{len(timeout_pdfs)} PDFs timed out: {timeout_pdfs}")
    print("###########################")
