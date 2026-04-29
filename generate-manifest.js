#!/usr/bin/env node
// Run from repo root: node generate-manifest.js
// Scans reports/YYYY-MM/ directories and writes reports/manifest.json

const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, 'reports');
const MANIFEST_PATH = path.join(REPORTS_DIR, 'manifest.json');

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function labelFromSlug(slug) {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function labelFromYYYYMM(value) {
  const [year, month] = value.split('-');
  return MONTHS[parseInt(month, 10) - 1] + ' ' + year;
}

if (!fs.existsSync(REPORTS_DIR)) {
  console.error('reports/ directory not found. Create it first.');
  process.exit(1);
}

const entries = fs.readdirSync(REPORTS_DIR, { withFileTypes: true });

const monthDirs = entries
  .filter(e => e.isDirectory() && /^\d{4}-\d{2}$/.test(e.name))
  .map(e => e.name)
  .sort((a, b) => b.localeCompare(a)); // newest first

const months = monthDirs.map(dirName => {
  const dirPath = path.join(REPORTS_DIR, dirName);
  const files = fs.readdirSync(dirPath)
    .filter(f => /\.(md|txt)$/i.test(f))
    .sort();

  const clients = files.map(f => {
    const base = path.basename(f, path.extname(f));
    return {
      label: labelFromSlug(base),
      file: `reports/${dirName}/${f}`
    };
  });

  return {
    label: labelFromYYYYMM(dirName),
    value: dirName,
    clients
  };
}).filter(m => m.clients.length > 0);

const manifest = { months };
fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

console.log(`Wrote reports/manifest.json — ${months.length} month(s), ${months.reduce((n,m)=>n+m.clients.length,0)} client file(s).`);
months.forEach(m => {
  console.log(`  ${m.label} (${m.value})`);
  m.clients.forEach(c => console.log(`    ${c.label} → ${c.file}`));
});
