# Import Your Google Sheets Data

## Quick Start (Easiest Method)

1. **Export from Google Sheets:**
   - File → Download → Comma-separated values (.csv)
   - Save the file

2. **Convert to JSON:**
   - Save the CSV file as `input.csv` in this directory
   - Run: `node convert-google-sheet.js`
   - This creates `dpt-schools-import.json`

3. **Import into your app:**
   - Go to your DPT Tracker app → Schools page
   - Click "Bulk Import"
   - Select `dpt-schools-import.json`
   - Done! 🎉

## Alternative: Use the Browser Converter

1. Open `convert-dpt-data.html` in your browser
2. Copy all your Google Sheet data (Cmd/Ctrl+A, then Cmd/Ctrl+C)
3. Paste into the converter
4. Click "Convert to JSON"
5. Download and import

## What Gets Imported

- ✅ School name
- ✅ Location (City, State)
- ✅ Website URL (if available)
- ✅ DPT Program URL (extracts real PTCAS URLs when available)
- ✅ Notes (if any)

## Notes

- Duplicate schools are automatically skipped
- Google search URLs are filtered out
- Only real PTCAS directory URLs are used for DPT program links
- Prerequisites are not included (add those separately if needed)

