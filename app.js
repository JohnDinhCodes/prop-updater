const sqlite3 = require('sqlite3').verbose();
const dirTree = require('directory-tree');
const PATH = require('path');
const dignityTree = dirTree('./../Dignity');
const replace = require('replace-in-file');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const moment = require('moment');


for (let area of dignityTree.children) {

    for (let hospital of area.children) {

        for (let containingFolder of hospital.children) {

            let prop = '';
            let db3 = '';

            if (containingFolder.name.includes('zDI')) {
                containingFolder.children.forEach(folder => {
                    if (folder.name.includes('zconfig') ) {
                        folder.children.forEach(file => {
                            if (file.name === 'LL.prop') {
                                prop = file.path;
                            }
                        })
                        if (currentDB3Tree(prop.replace(/zDI[\S]+/, getContainingDB3Folder(prop)))) {
                            currentDB3Tree(prop.replace(/zDI[\S]+/, getContainingDB3Folder(prop))).children.forEach(file => {
                                if (file.name.includes(getDB3FileName(prop))) {
                                    db3 = file.path.replace(/\\/g, '/');
                                }
                            });
                        } else {
                            console.log(`No DB3 File found at: ${currentDB3Tree(prop.replace(/zDI[\S]+/, '')).path}`);
                        }
                    }
                });
            }
            if (prop.length > 0 && db3.length > 0) {
                createData(db3).then(queries => {
                    updateProp(queries, prop);
                });
            }
        }
    }
}

// Functions related to DB3
function getContainingDB3Folder(prop) {
    return fs.readFileSync(prop, 'utf8').match(/zCA[\w | .]+[/ex_inp]+/)[0];
}

function currentDB3Tree(path) {
    return dirTree(path)
}

function getDB3FileName(prop) {
    return fs.readFileSync(prop, 'utf8').match(/dign[\S]+835[\w]+/)[0];
}


// Function with Promise that returns queries as an object
function createData(database) {
    let sql = `SELECT CLP01 
    FROM L2100
    WHERE REPLACE(CLP01, '0', '') = ''
    OR REPLACE(CLP01, '9', '') = ''
    OR CLP01 = 'UNKNOWN'
    GROUP BY CLP01`;
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(database, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                return console.error(err.message);
            }
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

function updateProp(queries, prop) {
    // Make Delimited String With Search Results From DB3
    const data = [];
    let claimString = 'script.ignoreClaims=';

    for (let claim of queries) {
        data.push(claim.clp01);
    }

    for (let i = 0; i < data.length; i++) {
        if (i === data.length - 1) {
            claimString += data[i];
        } else {
            claimString += (data[i] + '|');
        }
    }

    // Make String With Current Week Number
    let weekNumber = moment().date(0).format('WW');
    let weekString = `${weekNumber} with Week Number`

    //Make String With Current Year
    let yearNumber = moment().date(0).format('YY');
    let yearString = `Y${yearNumber} with Year`

    const options = {
        files: prop,
        from: [/^script.ignoreClaims=?[^\s]+/m, /[0-9]+ with Week Number/, /Y[0-9]+ with Year/],
        to: [claimString, weekString, yearString]
    };


    replace(options)
        .then(changes => {
            if (changes.length > 0) {
                console.log('Modified files:', changes.join(', '));
            }
        })
        .catch(error => {
            console.error('Error occured:', error)
        });
}