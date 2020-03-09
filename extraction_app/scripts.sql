-- All PDFs
select * from extraction_app.x_pdfs;

-- Count of PDFs
select count(*) from extraction_app.x_pdfs;

-- PDFs that are not in the list but referenced in CSVs
select distinct(t1.fileId)
from x_csvs t1
left join x_pdfs t2 on t2.fileId = t1.fileId
where t2.fileId is null;

-- All CSVs
select * from extraction_app.x_csvs;

-- Table names and CSV count
select count(*) as total, count(if(tableName = "", 1, null)) as empty_name, count(if(tableName != "", 1, null)) as non_empty_name FROM x_csvs;

-- Number of CSV that have are 2nd+ on page
select count(if(tableNumber > 1, 1, null)) as more_than_one_table_per_page from extraction_app.x_csvs;

-- Clear CSVs
delete from x_csvs;

-- Clear PDFs
delete from x_pdfs