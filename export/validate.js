'use strict';

const fs = require('fs');
console.log("Validating package dump...")
JSON.parse(fs.readFileSync('docs/packages.json'))

