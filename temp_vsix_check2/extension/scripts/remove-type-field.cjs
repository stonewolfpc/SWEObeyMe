const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('dist/package.json', 'utf8'));
delete pkg.type;
fs.writeFileSync('dist/package.json', JSON.stringify(pkg, null, 2));
