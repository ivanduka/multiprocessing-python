import os
import io
from glob import glob
from subprocess import run, TimeoutExpired, CalledProcessError, PIPE, STDOUT
import sys
import contextlib
from sqlalchemy import create_engine
import pandas as pd
from dotenv import load_dotenv
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

load_dotenv()


def get_something_from_f_drive():
    folder = r"F:\Environmental Baseline Data\text_from_all_files_in_REGDOCS\txt"
    pdf_files = glob(f"{folder}/*.json")
    print(f"Number of files in {folder}: {len(pdf_files)}")
    print()


def get_something_from_db():
    conn_str = 'mssql+pyodbc://psql21cap/CS_Prod?trusted_connection=yes&driver=ODBC+Driver+17+for+SQL+Server'
    conn = create_engine(conn_str)
    query = 'SELECT DataID from DTreeCore WHERE SubType = 144'
    df = pd.read_sql(query, conn)
    print(f"Query '{query}' returned {df.shape[0]} results")
    print()


def simple_printing():
    print("Simple printing of Python executable file location: " + sys.executable)
    print()


def running_external_app():
    timeout = 1 * 60  # in seconds
    arguments = ["ping", "8.8.8.8", "-n", "1"]
    result = {}

    try:
        result = run(arguments, timeout=timeout, stderr=STDOUT, stdout=PIPE, shell=True)
    except (TimeoutExpired, CalledProcessError) as e:
        print(e)
    text_output = result.stdout.decode("utf-8")
    print(f"Running an external command {' '.join(arguments)} in terminal:")
    print(text_output)


def send_email(text):
    message = Mail(
        from_email='ivan.duka@prime_minister_office.ca',
        to_emails=["ivan.duka@cer-rec.gc.ca", 'ivan.duka.pm@gmail.com'],
        subject='Testing the automatically scheduled Python script ;)',
        plain_text_content=text)
    try:
        sg = SendGridAPIClient(os.getenv("SENDGRID_API_KEY"))
        response = sg.send(message)
        print(response.status_code)
        print(response.body)
        print(response.headers)
    except Exception as e:
        print(str(e))


def main():
    simple_printing()
    get_something_from_db()
    get_something_from_f_drive()
    running_external_app()


if __name__ == "__main__":
    sys.stderr = sys.stdout
    with io.StringIO() as out_buf, contextlib.redirect_stdout(out_buf):
        main()
        output = out_buf.getvalue()
    send_email(output)
    print(output)
