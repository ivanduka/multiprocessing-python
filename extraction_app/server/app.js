require("dotenv").config();
const mysql = require("promise-mysql");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const glob = require("glob");

const imagesPath =
  "\\\\luxor\\data\\branch\\Environmental Baseline Data\\Web\\pdf_images";
const htmlTablesPath =
  "\\\\luxor\\data\\branch\\Environmental Baseline Data\\Web\\x_html_tables";
const y_html_tables_path =
  "\\\\luxor\\data\\branch\\Environmental Baseline Data\\Web\\y\\html_tables";

const app = express();

const db = async q => {
  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE
  };

  try {
    const connection = await mysql.createConnection(config);
    const results = await connection.query(q.query, q.params);
    await connection.end();
    return { error: null, results };
  } catch (error) {
    console.log(error);
    return { error, results: null };
  }
};

const get = async (req, res) => {
  const { fileId } = req.body;
  const query = `SELECT * FROM extraction_app.pdf_tables WHERE fileId = ${fileId} ORDER BY page DESC;`;
  const result = await db({ query, params: [] });
  res.json(result);
};

const create = async (req, res) => {
  const {
    uuid,
    fileId,
    page,
    tableTitle,
    x1,
    x2,
    y1,
    y2,
    pageHeight,
    pageWidth,
    continuationOf
  } = req.body;
  const query = {
    query:
      "INSERT INTO pdf_tables (uuid, fileId, page, pageWidth, pageHeight, x1, y1, x2, y2, tableTitle, continuationOf) VALUES (?,?,?,?,?,?,?,?,?,?,?);",
    params: [
      uuid,
      fileId,
      page,
      pageWidth,
      pageHeight,
      x1,
      y1,
      x2,
      y2,
      tableTitle,
      continuationOf
    ]
  };
  const result = await db(query);
  res.json(result);
};

const del = async (req, res) => {
  const { uuid } = req.body;
  const query = `DELETE
                   FROM extraction_app.pdf_tables
                   WHERE uuid = ?;`;
  const result = await db({ query, params: [uuid] });
  res.json(result);
};

const getIndex = async (req, res) => {
  const folders = glob.sync("./html/*").map(folderPath => {
    const arr = folderPath.split("/");
    return parseInt(arr[arr.length - 1]);
  });

  const { uuid } = req.body;
  const query = `SELECT fileId, COUNT(fileId) as freq
                   FROM extraction_app.pdf_tables
                   GROUP BY fileId
                   ORDER BY freq ASC;`;
  const result = await db({ query, params: [uuid] });
  const counts = result.results.reduce((accumulator, { fileId, freq }) => {
    accumulator[fileId] = freq;
    return accumulator;
  }, {});

  const items = folders.map(folderId => ({
    id: folderId,
    count: counts[folderId] ? counts[folderId] : 0
  }));
  items.sort((a, b) => a.count - b.count);

  res.json({ items });
};

const getValidation = async (req, res) => {
  try {
    const query = `SELECT *
                       FROM extraction_app.pdf_tables
                       WHERE result IS NULL
                       ORDER BY RAND()
                       LIMIT 1;`;
    const { results } = await db({ query }); // array
    res.json(results);
  } catch (e) {
    res.json({ error: e });
  }
};

const setValidation = async (req, res) => {
  const { uuid, result } = req.body;
  try {
    const query = `UPDATE pdf_tables SET result = '${result}' WHERE uuid = '${uuid}';`;
    await db({ query });
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
  }
};

const allXValidationPDFsQuery = `SELECT c.project,
                                        c.fileId,
                                        COUNT(*)                            AS total_tables,
                                        COUNT(IF(result IS NULL, 1, NULL))  AS not_processed,
                                        COUNT(IF(result = 'pass', 1, NULL)) AS passed,
                                        COUNT(IF(result = 'fail', 1, NULL)) AS failed
                                 FROM x_csvs c
                                 GROUP BY c.fileId
                                 ORDER BY c.project, c.fileId;`;

// x_validation
const x_indexValidation = async (req, res) => {
  const extraPDFsQuery = `SELECT DISTINCT(t1.fileId)
                            FROM x_csvs t1
                                     LEFT JOIN x_pdfs t2 ON t2.fileId = t1.fileId
                            WHERE t2.fileId IS NULL;`;

  try {
    const allXValidationPDFs = db({ query: allXValidationPDFsQuery });
    const extraPDFs = db({ query: extraPDFsQuery });
    const [pdfs, extraneousPDFs] = await Promise.all([
      allXValidationPDFs,
      extraPDFs
    ]);
    res.json({ extraneousPDFs: extraneousPDFs.results, pdfs: pdfs.results });
  } catch (e) {
    console.log(e);
  }
};

const x_getPageValidation = async (req, res) => {
  const { fileId } = req.body;
  const allTablesQuery = `SELECT * FROM x_csvs WHERE fileId = ${fileId};`;
  const pdfInfoQuery = `SELECT * FROM x_pdfs WHERE fileId = ${fileId};`;

  try {
    const allTables = db({ query: allTablesQuery });
    const pdfInfo = db({ query: pdfInfoQuery });
    const [tables, pdf] = await Promise.all([allTables, pdfInfo]);
    res.json({ pdf: pdf.results, tables: tables.results });
  } catch (e) {
    console.log(e);
  }
};

const x_setCSVValidation = async (req, res) => {
  const { csvName, result } = req.body;
  const query = `UPDATE x_csvs SET result = ${
    result ? `'${result}'` : "NULL"
  } WHERE csvName = '${csvName}';`;

  try {
    await db({ query });
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
};

// Y Validation
const y_index = async (req, res) => {
  const pdfQuery = `SELECT pd.*, pr.project as project FROM y_pdfs pd LEFT JOIN y_projects pr ON pd.fileId = pr.fileId ORDER BY pd.fileId;`;

  try {
    const { results } = await db({ query: pdfQuery });
    res.json(results);
  } catch (e) {
    console.log(e);
  }
};

const y_getItem = async (req, res) => {
  const { fileId } = req.body;
  const allTablesQuery = `SELECT * FROM y_tables WHERE fileId = ${fileId};`;
  const pdfInfoQuery = `SELECT * FROM y_pdfs pdf LEFT JOIN y_projects proj ON proj.fileId = pdf.fileId WHERE pdf.fileId = ${fileId};`;

  try {
    const allTables = db({ query: allTablesQuery });
    const pdfInfo = db({ query: pdfInfoQuery });
    const [tables, pdf] = await Promise.all([allTables, pdfInfo]);
    res.json({ pdf: pdf.results[0], tables: tables.results });
  } catch (e) {
    console.log(e);
  }
};

app.use(bodyParser.json());
app.use(cors());

app.use("/", express.static(path.join(__dirname, "/html")));
app.use("/", express.static(path.join(__dirname, "/public")));
app.use("/jpg_tables", express.static(path.join(__dirname, "/jpg_tables")));
app.use("/html_tables", express.static(path.join(__dirname, "/html_tables")));

// x_validation & y_validation (shared)
app.use("/pdf_images", express.static(imagesPath));

// x_validation
app.get("/api/x/getAll", x_indexValidation);
app.post("/api/x/getValidation", x_getPageValidation);
app.post("/api/x/setValidation", x_setCSVValidation);
app.use("/x_html_tables", express.static(htmlTablesPath));

// y_validation
app.get("/api/y/getAll", y_index);
app.post("/api/y/getItem", y_getItem);
app.use("/y_html_tables", express.static(y_html_tables_path));

// Application
app.post("/api/get", get);
app.post("/api/create", create);
app.post("/api/delete", del);

// Main app
app.get("/api/getIndex", getIndex);

// Validation
app.get("/api/getValidation", getValidation);
app.post("/api/setValidation", setValidation);

const port = 8080;
app.listen(port, () => console.log(`Listening on port ${port}...`));
