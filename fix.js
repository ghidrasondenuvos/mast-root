const fs = require('fs');
const files = ['DatabaseViewer.js'];

files.forEach(f => {
    let content = fs.readFileSync('public/components/' + f, 'utf8');
    content = content.replace(/\\`/g, '`').replace(/\\\$/g, '$');
    fs.writeFileSync('public/components/' + f, content);
    console.log(f + ' fixed');
});
