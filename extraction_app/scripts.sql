-- Get list of files for x_validation
SELECT 
    c.project,
    c.fileId,
    COUNT(*) AS total_tables,
    COUNT(IF(result IS NULL, 1, NULL)) AS not_processed,
    COUNT(IF(result = 'pass', 1, NULL)) AS passed,
    COUNT(IF(result = 'fail', 1, NULL)) AS failed,
    p.totalPages,
    p.pagesWithWordTable    
FROM
    x_csvs c
        INNER JOIN
    x_pdfs p ON p.fileId = c.fileId
GROUP BY c.fileId;

-- Get one file for x_validation
SELECT 
    c.project,
    c.fileId,
    COUNT(*) AS total_tables,
    COUNT(IF(result IS NULL, 1, NULL)) AS not_processed,
    COUNT(IF(result = 'pass', 1, NULL)) AS passed,
    COUNT(IF(result = 'fail', 1, NULL)) AS failed,
    p.totalPages,
    p.pagesWithWordTable    
FROM
    x_csvs c
        INNER JOIN
    x_pdfs p ON p.fileId = c.fileId
WHERE c.fileId = 1059614;
    
SELECT 
    COUNT(*)
FROM
    x_csvs
WHERE
    fileId = 1059614;

-- All PDFs
select * from extraction_app.x_pdfs;
select COUNT(*) from extraction_app.x_pdfs WHERE pagesWithWordTable IS NULL;
select COUNT(*) from extraction_app.x_pdfs WHERE totalPages IS NULL;

SELECT 
(SELECT COUNT(*) FROM extraction_app.x_pdfs) AS total,
(SELECT COUNT(*) FROM extraction_app.x_pdfs WHERE extractedImages IS NULL) AS not_processed,
(SELECT COUNT(*) FROM extraction_app.x_pdfs WHERE extractedImages IS NOT NULL) AS processed
FROM DUAL;

-- Count of PDFs
select count(*) from extraction_app.x_pdfs;

-- Count of pages
SELECT SUM(totalPages) FROM x_pdfs;
SELECT SUM(totalPagesWithWordTable) FROM x_pdfs;

-- PDFs that are not in the list but referenced in CSVs
select distinct(t1.fileId)
from x_csvs t1
left join x_pdfs t2 on t2.fileId = t1.fileId
where t2.fileId is null;

-- PDFs that are in the list but have no referenced CSVs
select COUNT(t1.fileId)
from x_pdfs t1
left join x_csvs t2 on t2.fileId = t1.fileId
where t2.fileId is null;

-- All CSVs
select * from extraction_app.x_csvs;



-- Table names and CSV count
select count(*) as total, count(if(tableName = "", 1, null)) as empty_name, count(if(tableName != "", 1, null)) as non_empty_name FROM x_csvs;

-- Number of CSV that have are 2nd+ on page
select count(if(tableNumber > 1, 1, null)) as more_than_one_table_per_page from extraction_app.x_csvs;

-- Clear CSVs
-- delete from x_csvs;

-- Clear PDFs
-- delete from x_pdfs