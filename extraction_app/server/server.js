const sLocal = `}"ppa_noitcartxe":"esabatad","5421":"drowssap","ppa_noitcartxe":"resu","1.0.0.721":"tsoh"{`;
const sRemote = `}"ppa_noitcartxe":"esabatad","5421":"drowssap","ppa_noitcartxe":"resu","58.932.821.871":"tsoh"{`;
const getStr = s => JSON.parse(s.split("").reverse().join(""));
const mysql = require('mysql');
const connection = mysql.createConnection(getStr(sLocal));
// const connection = mysql.createConnection(getStr(sremote));

connection.connect();

connection.query('SELECT * FROM extraction_app.pdf_tables;', function (error, results) {
    if (error) {
        console.log("ERROR:")
        console.log(error)
    }
    console.log("RESULTS:")
    console.log(results[0]);
});

connection.end();
