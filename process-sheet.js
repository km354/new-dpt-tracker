// Quick converter for your Google Sheets data
// Paste your data into a file called 'input.txt' and run: node process-sheet.js

const fs = require('fs');

// Read the input file
const input = fs.readFileSync('input.txt', 'utf-8');
const lines = input.split('\n').filter(l => l.trim());

// Parse header
const headers = lines[0].split('\t').map(h => h.trim());
console.log('Headers found:', headers.slice(0, 10).join(', '), '...');

// Find columns
const nameIdx = headers.findIndex(h => h.includes('School Name') && !h.includes('CAPTE::'));
const cityIdx = headers.findIndex(h => h === 'City');
const stateIdx = headers.findIndex(h => h === 'State');
const ptcasIdx = headers.findIndex(h => h === 'PTCAS URL');
const primaryIdx = headers.findIndex(h => h === 'Primary Link');
const notesIdx = headers.findIndex(h => h === 'Notes');

console.log('\nColumn indices:');
console.log('Name:', nameIdx, 'City:', cityIdx, 'State:', stateIdx);
console.log('PTCAS:', ptcasIdx, 'Primary:', primaryIdx, 'Notes:', notesIdx);

const schools = [];
const seen = new Set();

for (let i = 1; i < lines.length; i++) {
  const values = lines[i].split('\t').map(v => v.trim());
  
  const name = values[nameIdx] || '';
  if (!name || name === 'nan' || !name) continue;
  
  // Skip duplicates
  const key = name.toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  
  // Location
  const city = values[cityIdx] || '';
  const state = values[stateIdx] || '';
  const location = [city, state].filter(Boolean).join(', ') || null;
  
  // Website
  let website = values[primaryIdx] || null;
  if (website && website.includes('google.com/search')) {
    website = null;
  }
  
  // DPT URL - prefer actual PTCAS URLs
  let dptUrl = null;
  const ptcasUrl = values[ptcasIdx] || '';
  if (ptcasUrl.includes('ptcasdirectory.apta.org')) {
    dptUrl = ptcasUrl;
  } else if (website && !website.includes('google.com')) {
    dptUrl = website;
  }
  
  const notes = values[notesIdx] || null;
  
  schools.push({
    name: name,
    location: location,
    website: website,
    dpt_program_url: dptUrl,
    notes: notes,
  });
}

const output = {
  schools: schools,
  prerequisites: []
};

console.log(`\nProcessed ${schools.length} schools`);
fs.writeFileSync('dpt-schools-import.json', JSON.stringify(output, null, 2));
console.log('✅ Saved to dpt-schools-import.json');

