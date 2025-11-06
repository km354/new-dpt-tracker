# Converting Google Sheets to JSON Import Format

## Step-by-Step Instructions

### Option 1: Manual Conversion (Recommended)

1. **Open your Google Sheet**

2. **Ensure your columns match this structure:**

   **For Schools:**
   - `name` (required) - School name
   - `location` (optional) - City, State
   - `website` (optional) - General website URL
   - `dpt_program_url` (optional) - Direct link to DPT program page
   - `notes` (optional) - Any additional notes

   **For Prerequisites:**
   - `school_name` (required) - Must match a school name exactly
   - `subject` (required) - Course subject (e.g., "Anatomy")
   - `min_grade` (optional) - Minimum grade (e.g., "B", "C+")
   - `required_credits` (optional) - Number of credits (e.g., 3, 4)

3. **Export your data:**
   - File → Download → Comma-separated values (.csv)
   - Or copy the data directly

4. **Convert to JSON format:**

   **If your sheet has separate sheets/tabs:**
   - One tab for schools
   - One tab for prerequisites (with school_name column)

   **If your sheet has everything in one tab:**
   - You may need to organize it into two sections

### Option 2: Use Online Converter

1. Export your Google Sheet as CSV
2. Use an online CSV to JSON converter
3. Manually format to match our structure (see below)

### Option 3: Use the Bulk Import Feature Directly

The bulk import feature accepts CSV files! Just make sure:
- Your CSV has headers matching the expected format
- School name is in a column called "name"
- Prerequisites are in separate rows with "school_name" matching school names

## Expected JSON Format

```json
{
  "schools": [
    {
      "name": "University Name",
      "location": "City, State",
      "website": "https://university.edu",
      "dpt_program_url": "https://university.edu/dpt-program",
      "notes": "Optional notes"
    }
  ],
  "prerequisites": [
    {
      "school_name": "University Name",
      "subject": "Anatomy",
      "min_grade": "B",
      "required_credits": 3
    }
  ]
}
```

## Common Google Sheets Structures

### Structure 1: One Row Per School with Prerequisites Listed
**If prerequisites are in the same row:**
- You'll need to split into separate prerequisite rows
- Each prerequisite gets its own row with school_name

### Structure 2: Separate Tabs for Schools and Prerequisites
**Perfect!** Just export each tab separately and combine.

### Structure 3: Multiple Prerequisites Per School
**Good!** Each prerequisite should be a separate row with the same school_name.

## Quick Conversion Tips

1. **School names must match exactly** between schools and prerequisites
2. **URLs** should include `http://` or `https://`
3. **Credits** should be numbers (not text like "3 hours")
4. **Grades** can be text like "B", "B+", "C", or null

## Need Help?

If your sheet structure is different, share:
- How your columns are organized
- Whether prerequisites are in the same sheet or separate
- A sample of your data structure

I can help you create a custom conversion script!

