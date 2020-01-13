import os
from multiprocessing import Pool
import time
from subprocess import run, TimeoutExpired, CalledProcessError, DEVNULL
from glob import glob


# Function runs a single unit of work (processing one PDF)
def do_work(args):
    debugging = False  # change to True/False to see/not see the pdf2html output/errors
    std = None if debugging else DEVNULL
    timeout = 20 * 60  # timeout in seconds before terminating a subprocess, default is 1200s (20 min)

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
    print(f"{pdf_index} finished {pdf_name} in {item_duration} seconds.")
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


# Function converts full paths to PDFs into a command line arguments for pdfToHtml executable
def create_arguments(inputs):
    args = []
    for j in range(len(inputs)):
        current_file = pdf_files[j]
        current_file_index = f"{j + 1}/{len(pdf_files)}"
        arg = [current_file_index, pdf_to_html_exe, current_file, "--dest-dir", out_directory]
        args.append(arg)
    return args


if __name__ == "__main__":
    # Marking the start time of the script
    start_time = time.time()

    # Path to pdfToHtml executable file
    pdf_to_html_exe = r"F:/Environmental Baseline Data/Version 2/Code/EXE Files/pdf2htmlEX-win32-0.14.6-upx-with-poppler-data/pdf2htmlEX.exe"

    # Path to the folder with PDF files
    pdf_files = sorted(glob(r"F:\Environmental Baseline Data\Version 3\Data\PDF\*.pdf"))[:]

    # Path to the output folder where you need HTML files to be stored
    out_directory = r"c:\Users\T1Ivan\Desktop\PDF\out"

    # Converting full file paths to arguments for pdfToHtml
    work_items = create_arguments(pdf_files)

    # Header information block
    print("\n###########################")
    print(f"Starting {len(pdf_files)} PDFs")
    print("###########################\n")

    # Running all the work in multiprocessing mode
    # with Pool() as pool:
    #     results = pool.map(do_work, work_items)

    # === [For reference only] the sequential processing way as opposed to multiprocessing ===
    results = []
    for work_item in work_items:
        results.append(do_work(work_item))

    # Sorting the results into two lists with multiprocessing: successfully processed and time outed PDFs
    success_pdfs, timeout_pdfs = parse_results(results)

    # Calculating the duration of the script run
    duration = time.time() - start_time

    # Footer information block
    print("\n###########################")
    print(f"Done {len(success_pdfs)} PDFs in {round(duration)} seconds.")
    print(f"{len(success_pdfs)} PDFs are done: {list(success_pdfs)}")
    print(f"{len(timeout_pdfs)} PDFs timed out: {list(timeout_pdfs)}")
    print("###########################")
