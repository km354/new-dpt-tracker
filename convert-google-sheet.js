#!/usr/bin/env node

/**
 * Convert Google Sheets DPT data to JSON import format
 * 
 * Usage:
 *   1. Export your Google Sheet as CSV (File → Download → CSV)
 *   2. Save it as 'input.csv'
 *   3. Run: node convert-google-sheet.js
 *   4. Import the generated 'dpt-schools-import.json' via Bulk Import
 */

const fs = require('fs');
const path = require('path');

function convertCSV() {
  const inputFile = path.join(__dirname, 'input.csv');
  
  if (!fs.existsSync(inputFile)) {
    console.error('❌ Error: input.csv not found!');
    console.log('\n📋 Steps:');
    console.log('1. Export your Google Sheet as CSV');
    console.log('2. Save it as "input.csv" in this directory');
    console.log('3. Run this script again');
    process.exit(1);
  }

  console.log('📖 Reading input.csv...');
  const input = fs.readFileSync(inputFile, 'utf-8');
  const lines = input.split('\n').filter(l => l.trim());

  if (lines.length < 2) {
    console.error('❌ Error: CSV must have at least a header and one data row');
    process.exit(1);
  }

  // Parse header - handle both tab and comma separated
  const delimiter = input.includes('\t') ? '\t' : ',';
  const headers = lines[0].split(delimiter).map(h => h.trim());
  
  console.log(`📊 Found ${headers.length} columns`);
  console.log(`📝 First few headers: ${headers.slice(0, 5).join(', ')}...`);

  // Find column indices
  const nameIdx = headers.findIndex(h => 
    h.includes('School Name') && !h.includes('CAPTE::')
  );
  const cityIdx = headers.findIndex(h => h === 'City');
  const stateIdx = headers.findIndex(h => h === 'State');
  const ptcasIdx = headers.findIndex(h => h === 'PTCAS URL');
  const primaryIdx = headers.findIndex(h => h === 'Primary Link');
  const notesIdx = headers.findIndex(h => h === 'Notes');

  if (nameIdx === -1) {
    console.error('❌ Error: Could not find "School Name" column');
    console.log('Available columns:', headers.slice(0, 10).join(', '));
    process.exit(1);
  }

  console.log(`\n✅ Found columns:`);
  console.log(`   Name: ${headers[nameIdx]}`);
  console.log(`   City: ${cityIdx >= 0 ? headers[cityIdx] : 'not found'}`);
  console.log(`   State: ${stateIdx >= 0 ? headers[stateIdx] : 'not found'}`);
  console.log(`   PTCAS URL: ${ptcasIdx >= 0 ? headers[ptcasIdx] : 'not found'}`);

  const schools = [];
  const seen = new Set();
  let skipped = 0;

  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse row - handle quoted values
    const values = parseCSVLine(line, delimiter);
    
    const name = (values[nameIdx] || '').trim();
    if (!name || name === 'nan' || name === '') continue;
    
    // Skip duplicates
    const key = name.toLowerCase().trim();
    if (seen.has(key)) {
      skipped++;
      continue;
    }
    seen.add(key);
    
    // Build location
    const city = (cityIdx >= 0 ? values[cityIdx] : '') || '';
    const state = (stateIdx >= 0 ? values[stateIdx] : '') || '';
    const location = [city, state].filter(Boolean).join(', ') || null;
    
    // Get website (skip Google search URLs)
    let website = (primaryIdx >= 0 ? values[primaryIdx] : '') || null;
    if (website && website.includes('google.com/search')) {
      website = null;
    }
    
    // Get DPT program URL - prefer actual PTCAS directory URLs
    let dptUrl = null;
    const ptcasUrl = (ptcasIdx >= 0 ? values[ptcasIdx] : '') || '';
    if (ptcasUrl && ptcasUrl.includes('ptcasdirectory.apta.org')) {
      dptUrl = ptcasUrl;
    } else if (website && !website.includes('google.com')) {
      dptUrl = website;
    }
    
    const notes = (notesIdx >= 0 ? values[notesIdx] : '') || null;
    
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

  const outputFile = path.join(__dirname, 'dpt-schools-import.json');
  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));

  console.log(`\n✅ Conversion complete!`);
  console.log(`   📚 Schools processed: ${schools.length}`);
  console.log(`   ⏭️  Duplicates skipped: ${skipped}`);
  console.log(`   💾 Saved to: ${outputFile}`);
  console.log(`\n📥 Next steps:`);
  console.log(`   1. Go to your DPT Tracker app`);
  console.log(`   2. Navigate to Schools page`);
  console.log(`   3. Click "Bulk Import"`);
  console.log(`   4. Select: ${outputFile}`);
  console.log(`   5. Done! 🎉`);
}

// Parse CSV line handling quoted values
function parseCSVLine(line, delimiter) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current); // Add last value
  return values;
}

// Run conversion
convertCSV();

