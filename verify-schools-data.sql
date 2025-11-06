-- Verify and clean up schools data
-- Run this in Supabase SQL Editor

-- 1. Count total schools
SELECT COUNT(*) as total_schools FROM schools;

-- 2. Find duplicate schools (case-insensitive)
SELECT 
  LOWER(TRIM(name)) as normalized_name,
  COUNT(*) as count,
  array_agg(id) as school_ids,
  array_agg(name) as names
FROM schools
GROUP BY LOWER(TRIM(name))
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 3. Find schools with invalid URLs (Google search links)
SELECT 
  id,
  name,
  website,
  dpt_program_url
FROM schools
WHERE website LIKE '%google.com/search%' 
   OR dpt_program_url LIKE '%google.com/search%'
ORDER BY name;

-- 4. Find schools with missing or invalid website URLs
SELECT 
  id,
  name,
  website,
  dpt_program_url
FROM schools
WHERE (website IS NOT NULL AND NOT website LIKE 'http%')
   OR (dpt_program_url IS NOT NULL AND NOT dpt_program_url LIKE 'http%')
ORDER BY name;

-- 5. Find schools with same name but different casing (potential duplicates)
SELECT 
  LOWER(TRIM(name)) as normalized_name,
  COUNT(*) as count,
  string_agg(name, ', ') as names
FROM schools
GROUP BY LOWER(TRIM(name))
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 6. Clean up: Remove duplicate schools (keeps the first one, deletes others)
-- WARNING: Run this carefully! Review the duplicates first using query #2 above
/*
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(name)) 
      ORDER BY created_at ASC
    ) as rn
  FROM schools
)
DELETE FROM schools
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);
*/

-- 7. Clean up: Remove Google search URLs
/*
UPDATE schools
SET website = NULL
WHERE website LIKE '%google.com/search%';

UPDATE schools
SET dpt_program_url = NULL
WHERE dpt_program_url LIKE '%google.com/search%';
*/

-- 8. Normalize school names (trim whitespace)
/*
UPDATE schools
SET name = TRIM(name)
WHERE name != TRIM(name);
*/

