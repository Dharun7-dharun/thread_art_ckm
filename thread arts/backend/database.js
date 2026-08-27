const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'db.json');

function readDb() {
  try {
    if (!fs.existsSync(dbPath)) {
      return { products: [], slots: [], orders: [], settings: {} };
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    const parsed = JSON.parse(data);
    if (!parsed.settings) parsed.settings = {};
    return parsed;
  } catch (err) {
    console.error('Error reading database:', err);
    return { products: [], slots: [], orders: [], settings: {} };
  }
}

function writeDb(data) {
  try {
    // Write to a temporary file first, then rename, to prevent file corruption
    const tempPath = dbPath + '.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempPath, dbPath);
    return true;
  } catch (err) {
    console.error('Error writing database:', err);
    return false;
  }
}

module.exports = {
  readDb,
  writeDb
};
