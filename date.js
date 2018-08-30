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

            if (containingFolder.name.includes('zDI')) {
                containingFolder.children.forEach(folder => {
                    if (folder.name.includes('zconfig') ) {
                        folder.children.forEach(file => {
                            if (file.name === 'LL.prop') {
                                prop = file.path.replace(/\\/g, '/');
                            }
                        });
                    }
                });
            }
            if (prop.length > 0) {
                updateDate(prop);
            }
        }
    }
}

function updateDate(prop) {
        // Make String With Current Week Number
        let weekNumber = moment().date(0).format('WW');
        let weekString = `w${weekNumber}`
    
        //Make String With Current Year
        let yearNumber = moment().date(0).format('YY');
        let yearString = `Y${yearNumber}`

        let dateNumber = moment().date(0).subtract(1, 'years').format('YYYY-MM-DD');
        let dateString = `SelectDate=${dateNumber.replace(/-/g, '')}`;

        const options = {
            files: prop,
            from: [/w[0-9]+/g, /Y[0-9]+/g, /SelectDate=[0-9]+/],
            to: [weekString, yearString, dateString]
        };


        replace(options)
        .then(changes => {
            if (changes.length > 0) {
                console.log('[DATE] Modified files:', changes.join(', '));
            }
        })
        .catch(error => {
            console.error('Error occured:', error)
        });
    }