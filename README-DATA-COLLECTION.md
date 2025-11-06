# DPT Program Data Collection Guide

## Quick Start

### Option 1: Use Existing Spreadsheets (Fastest)
1. Search for "PTCAS Program Spreadsheet" online
2. Download/access a pre-made spreadsheet
3. Convert to our JSON format (see template)
4. Import via Bulk Import feature

### Option 2: Manual Collection (Most Accurate)
1. Go to PTCAS Directory: https://ptcasdirectory.apta.org/
2. For each program, collect:
   - School name
   - Location
   - Website URL
   - DPT program admissions page URL
   - Prerequisites (subject, min grade, credits)
3. Use our CSV template or JSON format
4. Import via Bulk Import feature

### Option 3: Hybrid Approach
1. Start with a pre-made spreadsheet as baseline
2. Verify and update data manually
3. Add missing information (especially DPT program URLs)
4. Import

## Data Collection Priority

**Start with:**
1. Schools you're actually applying to
2. Schools in your preferred location
3. Top-ranked programs

**Then expand to:**
- All programs in your state
- Programs in neighboring states
- Complete database (if you want comprehensive coverage)

## Time Estimates

- **Per School:** 5-10 minutes (manual collection)
- **10 Schools:** ~1-2 hours
- **50 Schools:** ~5-8 hours
- **All Programs (~250):** ~20-40 hours

## Tools to Help

1. **Browser Bookmarks:** Organize schools by state/region
2. **Spreadsheet:** Use Google Sheets or Excel during collection
3. **Browser Console Script:** See `ptcas-import-helper.js` for basic extraction
4. **Notes App:** Keep track of which schools you've completed

## Import Format

See `public/sample-import-template.json` for the exact format.

**Key Points:**
- `school_name` in prerequisites must match `name` in schools
- URLs must be valid (include http:// or https://)
- Credits can be numbers or null
- Min grade can be text (A, B+, C) or null

## Verifying Data

After importing:
1. Check a few schools manually
2. Verify DPT program URLs work
3. Check prerequisites are complete
4. Update any missing information

## Maintenance

- **Annual Updates:** Requirements change, verify once per year
- **Deadlines:** Update application deadlines seasonally
- **New Programs:** Add newly accredited programs as they appear

