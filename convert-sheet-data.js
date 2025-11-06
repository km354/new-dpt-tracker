#!/usr/bin/env node

/**
 * Convert Google Sheets DPT data to JSON import format
 * 
 * Usage: node convert-sheet-data.js < input.txt > output.json
 * Or paste data into the script and run it
 */

const fs = require('fs');
const readline = require('readline');

// Paste your sheet data here (tab-separated)
const inputData = process.argv[2] 
  ? fs.readFileSync(process.argv[2], 'utf-8')
  : null;

function parseSheetData(text) {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('Need at least header and one data row');
  }

  // Parse header
  const headers = lines[0].split('\t').map(h => h.trim());
  
  // Find column indices
  const nameCol = headers.findIndex(h => 
    h.includes('School Name') || h.includes('Account Name')
  );
  const cityCol = headers.findIndex(h => h === 'City' || h.includes('CAPTE::City'));
  const stateCol = headers.findIndex(h => h === 'State' || h.includes('CAPTE::State'));
  const websiteCol = headers.findIndex(h => 
    h === 'Primary Link' || h.includes('CAPTE::Primary Link') || h === 'Website'
  );
  const ptcasUrlCol = headers.findIndex(h => 
    h.includes('PTCAS URL') && !h.includes('Search')
  );
  const notesCol = headers.findIndex(h => h === 'Notes');

  if (nameCol === -1) {
    throw new Error('Could not find School Name column');
  }

  const schools = [];
  const seen = new Set();

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t').map(v => v.trim());
    
    const name = values[nameCol] || '';
    if (!name || name === 'nan') continue;

    // Skip duplicates
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    // Build location
    const city = (cityCol >= 0 && values[cityCol]) || '';
    const state = (stateCol >= 0 && values[stateCol]) || '';
    const location = [city, state].filter(Boolean).join(', ') || null;

    // Get website
    let website = null;
    if (websiteCol >= 0 && values[websiteCol] && !values[websiteCol].includes('google.com/search')) {
      website = values[websiteCol];
    }

    // Get DPT program URL (prefer PTCAS URL if it's not a Google search)
    let dptUrl = null;
    if (ptcasUrlCol >= 0 && values[ptcasUrlCol]) {
      const url = values[ptcasUrlCol];
      if (url.includes('ptcasdirectory.apta.org')) {
        dptUrl = url;
      }
    }
    // If no good PTCAS URL, try website
    if (!dptUrl && website) {
      dptUrl = website;
    }

    const notes = (notesCol >= 0 && values[notesCol]) || null;

    schools.push({
      name: name,
      location: location,
      website: website,
      dpt_program_url: dptUrl,
      notes: notes,
    });
  }

  return { schools, prerequisites: [] };
}

// Main execution
if (require.main === module) {
  if (process.stdin.isTTY) {
    // Interactive mode - read from file argument
    if (!inputData) {
      console.error('Usage: node convert-sheet-data.js <input-file.txt>');
      console.error('   OR: cat input.txt | node convert-sheet-data.js');
      process.exit(1);
    }
    
    try {
      const result = parseSheetData(inputData);
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  } else {
    // Read from stdin
    let input = '';
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', (chunk) => {
      input += chunk;
    });
    
    process.stdin.on('end', () => {
      try {
        const result = parseSheetData(input);
        console.log(JSON.stringify(result, null, 2));
      } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
  }
}

module.exports = { parseSheetData };

