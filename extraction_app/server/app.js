require("dotenv").config();
const mysql = require("promise-mysql");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const glob = require("glob");

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");
app.use(bodyParser.json());
app.use(cors());

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
      "INSERT INTO pdf_tables" +
      "(uuid, fileId, page, pageWidth, pageHeight, x1, y1, x2, y2, tableTitle, continuationOf)" +
      "VALUES (?,?,?,?,?,?,?,?,?,?,?);",
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
  const query = `DELETE FROM extraction_app.pdf_tables WHERE uuid = ?;`;
  const result = await db({ query, params: [uuid] });
  res.json(result);
};

app.route("/api/get").post(get);
app.route("/api/create").post(create);
app.route("/api/delete").post(del);

const htmlFilesPath = path.join(__dirname, "/html");
app.use("/", express.static(htmlFilesPath));
app.use("/", express.static(path.join(__dirname, "/public")));

const folders = glob.sync("./html/*").map(folderPath => {
  const arr = folderPath.split("/");
  return parseInt(arr[arr.length - 1]);
});

const index = async (req, res) => {
  const { uuid } = req.body;
  const query = `SELECT fileId, COUNT(fileId) as freq FROM extraction_app.pdf_tables GROUP BY fileId ORDER BY freq ASC;`;
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

  res.render("index", { pageTitle: "Index of PDF files", items });
};

app.get("/", index);

const port = 80;
app.listen(port, () => console.log(`Listening on port ${port}...`));
