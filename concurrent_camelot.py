import os
import pickle
import time
from glob import glob
from pathlib import Path
import camelot
from multiprocessing import Pool

source_pdf_dir = Path(r'F:\Environmental Baseline Data\01 ESAs as PDF\ESA Documents')
results_dir = Path(r'F:\Environmental Baseline Data\text_from_all_files_in_REGDOCS\PDFs\results')


def process_table(pdf):
    try:
        tables = camelot.read_pdf(str(pdf), pages='all', flag_size=True, copy_text=['v'], line_scale=40)
        print(f'Process {os.getpid()} Processing File Name:{pdf}\nTotal Tables found:{len(tables)}')
        with open(results_dir.joinpath(f"{pdf.stem}.pkl"), 'wb') as f:
            pickle.dump(tables, f)
            print(f'Process {os.getpid()} Pickle file created for: {pdf}')
        with open(results_dir.joinpath(f"{pdf.stem}.pkl"), 'rb') as g:
            pickle.load(g)
            print(f'Process {os.getpid()} Pickle file loaded: {pdf}')
        return True
    except Exception as e:
        return {
            "pdf": pdf,
            "error": e
        }


def process_handler():
    pdf_paths = [Path(pdf) for pdf in sorted(glob(f"{source_pdf_dir}\\*.pdf"))[:12]]

    print(f"Working on {len(pdf_paths)}")

    start_time = time.time()

    # Sequential process
    results = []
    # for pdf in pdf_paths:
    #     results.append(process_table(pdf))

    # Multiprocessing
    with Pool() as pool:
        results = pool.map(process_table, pdf_paths)

    print(results)

    duration = round(time.time() - start_time)
    print(f'Whole Process completed in {duration} second(s)')


if __name__ == '__main__':
    process_handler()
