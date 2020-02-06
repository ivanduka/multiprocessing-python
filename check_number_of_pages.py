from glob import glob
from pathlib import Path
from PyPDF2 import PdfFileReader
import multiprocessing


def check_pages(pdf):
    with open(pdf, "rb") as f:
        try:
            read_pdf = PdfFileReader(f)
            document_pages = read_pdf.getNumPages()
            if document_pages >= 126:
                print(f"{pdf.stem}")
        except Exception:
            print(f"Error checking {pdf.stem}")
        return pdf.stem


if __name__ == "__main__":
    pdf_files = Path(r"F:\Environmental Baseline Data\Web\v01\pdfs")
    existing_pdfs = [Path(pdf) for pdf in glob(f"{pdf_files}\\*.pdf")]
    with multiprocessing.Pool() as pool:
        result = pool.map(check_pages, existing_pdfs)
    print(len(result))
    print(result)
