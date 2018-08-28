import gulp from 'gulp';

const sqlite3 = require('sqlite3').verbose();
const sqliteJson = require('sqlite-json');

let sql = `SELECT CLP01 
FROM L2100
WHERE REPLACE(CLP01, '9', '') = ''
OR REPLACE(CLP01, '9', '') = ''
OR CLP01 = 'UNKNOWN'
GROUP BY CLP01`;

class CreateJSON {
    constructor(db) {
        this.db = db
        this.openDB(this.db);
        this.saveJSON(this.db)
        this.closeDB();
    }

    openDB(db) {
        let db = new sqlite3.Database(db, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log('Connected to the database');
        });
    }

    saveJSON(db) {
        const exporter = sqliteJson(db);
        exporter.save(sql, 'temp.json', (err, json) => {
            console.log(`Saved temp JSON: ${json}`);
        });
    }

    closeDB() {
        db.close(err => {
            if (err) {
                return console.error(err.message);
            }
            console.log('Closed the database connection.');
        });
    }
}

export { CreateJSON as default }