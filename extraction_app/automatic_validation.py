from pathlib import Path
from dotenv import load_dotenv
import mysql.connector
import os

dot_env_path = Path(r"./server/.env")
load_dotenv(dotenv_path=dot_env_path)
host = os.getenv("DB_HOST")
database = os.getenv("DB_DATABASE")
user = os.getenv("DB_USER")
password = os.getenv("DB_PASS")

csv_tables_folder_path = Path(r"\\luxor\data\branch\Environmental Baseline Data\Version 4 - Final\CSV")

def populate_db():
    try:
        connection = mysql.connector.connect(user=user, password=password, host=host, database=database)
        cursor = connection.cursor()
        cursor.execute("DELETE FROM x_validation")
        connection.commit()
        print("Done deleting the table content")

        stmt = "INSERT INTO x_validation (project, csvName, fileId, tableName, page, tableNumber) VALUES (%s, %s, %s, %s, %s, %s)"
        total_rows = 0

        for project in csv_tables_folder_path.glob("*"):
            data = []
            project_name = project.stem
            for csv in project.glob("*.csv"):
                csv_name = csv.stem
                s = csv_name.split("_")
                file_id = s[0]
                table_number = s[-1]
                page_number = s[-2]
                if len(s) > 3:
                    table_name = s[1]
                else:
                    table_name = ""
                data.append((project_name, csv_name, file_id, table_name, page_number, table_number))
            cursor.executemany(stmt, data)
            total_rows += len(data)

        connection.commit()
        connection.close()
        print(f"Done inserting {total_rows} rows")
    except Exception as e:
        print("Error populating the DB:")
        print(e)


if __name__ == "__main__":
    populate_db()
