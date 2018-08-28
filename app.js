const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const dirTree = require('directory-tree');
const PATH = require('path');
const dignityTree = dirTree('./../Dignity');
const replace = require('replace-in-file');

for (let area of dignityTree.children) {

    for (let hospital of area.children) {
        let db3 = hospital.children[0].children[0].children[0].path.replace(/\\/g, '/');
        let prop = hospital.children[1].children[0].children[0].path.replace(/\\/g, '/');
        createData(db3).then(queries => {
            updateProp(queries, prop)
        });
    }
}


function createData(database) {
    let sql = `SELECT CLP01 
    FROM L2100
    WHERE REPLACE(CLP01, '9', '') = ''
    OR REPLACE(CLP01, '9', '') = ''
    OR CLP01 = 'UNKNOWN'
    GROUP BY CLP01`;
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(database, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log('Connected to the database');
        });
        const queries = [];
        db.each(sql, (err, row) => {
            if (err) {
                reject(err);
            } else {
                queries.push(row);
            }
        }, (err, n) => {
            if (err) {
                reject(err);
            } else {
                resolve(queries);
            }
        });
    });
}

let data = [];
createData('../Dignity/Arizona/hospital1/zCA_v2.15_Y18_w31/input/testing2.db3').then(value => {
    for (let claim of value) {
        data.push(claim.clp01);
    }
});

function updateProp(queries, prop) {
    const data = [];
    let string = 'script.ignoreClaims=';
    
    for (let claim of queries) {
        data.push(claim.clp01);
    }

    for (let i = 0; i < data.length; i++) {
        if (i === data.length - 1) {
            string += data[i];
        } else {
            string += (data[i] + '|');
        }
    }
    
    const options = {
        files: prop,
        from: /^script.ignoreClaims=?[^\s]+/m,
        to: string,
    };
    
    
    replace(options)
    .then(changes => {
        console.log('Modified files:', changes.join(', '));
    })
    .catch(error => {
        console.error('Error occured:', error)
    });

}