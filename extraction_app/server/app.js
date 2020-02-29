require('dotenv').config();
const mysql = require('promise-mysql');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');


const app = express();

app.use(bodyParser.json());
app.use(cors());

const db = async (q) => {
    const config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_DATABASE,
    };

    try {
        const connection = await mysql.createConnection(config);
        const results = await connection.query(q.query, q.params);
        await connection.end();
        return {error: null, results}
    } catch (error) {
        console.log(error);
        return {error, results: null};
    }
};

const get = async (req, res) => {
    const {fileId} = req.body;
    const query = `SELECT * FROM extraction_app.pdf_tables WHERE fileId = ${fileId} ORDER BY page DESC;`;
    const result = await db({query, params: []});
    res.json(result);
};

const create = async (req, res) => {
    const {uuid, fileId, page, tableTitle, x1, x2, y1, y2, pageHeight, pageWidth, continuationOf} = req.body;
    console.log(req.body);
    const query = {
        query:
            "INSERT INTO pdf_tables" +
            "(uuid, fileId, page, pageWidth, pageHeight, x1, y1, x2, y2, tableTitle, continuationOf)" +
            'VALUES (?,?,?,?,?,?,?,?,?,?,?);',
        params: [uuid, fileId, page, pageWidth, pageHeight, x1, y1, x2, y2, tableTitle, continuationOf]

    }
    const result = await db(query);
    res.json(result);
};

const del = async (req, res) => {
    const {uuid} = req.body;
    const query = `DELETE FROM extraction_app.pdf_tables WHERE uuid = ?;`;
    const result = await db({query, params: [uuid]});
    res.json(result);
};

app.route("/api/get").post(get);
app.route("/api/create").post(create);
app.route("/api/delete").post(del);

app.listen(3000, () => console.log("Listening..."));