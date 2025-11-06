-- Cleanup script for duplicate schools
-- STEP 1: First check how many duplicates exist
-- Run this query to see duplicates:

SELECT 
  LOWER(TRIM(name)) as normalized_name,
  COUNT(*) as duplicate_count,
  array_agg(id ORDER BY created_at) as school_ids,
  array_agg(name ORDER BY created_at) as names,
  array_agg(created_at ORDER BY created_at) as created_dates
FROM schools
GROUP BY LOWER(TRIM(name))
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- STEP 2: If you want to keep the oldest school and delete duplicates:
-- This will keep the first created school and delete newer duplicates

-- First, check what will be deleted (SAFE - read-only):
SELECT 
  s.id,
  s.name,
  s.created_at,
  s.location,
  s.website,
  s.dpt_program_url
FROM schools s
INNER JOIN (
  SELECT 
    LOWER(TRIM(name)) as normalized_name,
    MIN(created_at) as first_created
  FROM schools
  GROUP BY LOWER(TRIM(name))
  HAVING COUNT(*) > 1
) duplicates ON LOWER(TRIM(s.name)) = duplicates.normalized_name
WHERE s.created_at > duplicates.first_created
ORDER BY s.name, s.created_at;

-- STEP 3: Actually delete the duplicates (UNCOMMENT TO RUN):
/*
DELETE FROM schools
WHERE id IN (
  SELECT s.id
  FROM schools s
  INNER JOIN (
    SELECT 
      LOWER(TRIM(name)) as normalized_name,
      MIN(created_at) as first_created
    FROM schools
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
  ) duplicates ON LOWER(TRIM(s.name)) = duplicates.normalized_name
  WHERE s.created_at > duplicates.first_created
);
*/

-- STEP 4: Clean up invalid URLs
/*
UPDATE schools
SET website = NULL
WHERE website LIKE '%google.com/search%';

UPDATE schools
SET dpt_program_url = NULL
WHERE dpt_program_url LIKE '%google.com/search%';
*/

-- STEP 5: Verify final count
-- SELECT COUNT(*) as final_school_count FROM schools;

