/**
 * PTCAS Data Collection Helper
 * 
 * This is a browser console script to help collect data from PTCAS directory pages.
 * 
 * INSTRUCTIONS:
 * 1. Open PTCAS directory: https://ptcasdirectory.apta.org/
 * 2. Navigate to a program's detail page
 * 3. Open browser console (F12)
 * 4. Paste this script and run it
 * 5. Copy the output JSON
 * 
 * Note: This extracts visible data only. You may need to manually verify and add missing information.
 */

function collectPTCASData() {
  const data = {
    school: {},
    prerequisites: []
  };

  // Extract school name (adjust selector based on actual page structure)
  const schoolName = document.querySelector('h1, .program-name, [class*="program"]')?.textContent?.trim();
  if (schoolName) {
    data.school.name = schoolName;
  }

  // Extract location (look for common patterns)
  const locationText = document.body.innerText.match(/([A-Z][a-z]+,\s*[A-Z]{2})/);
  if (locationText) {
    data.school.location = locationText[1];
  }

  // Extract website URL
  const websiteLink = document.querySelector('a[href*="http"]');
  if (websiteLink) {
    data.school.website = websiteLink.href;
  }

  // Look for prerequisites section
  const prereqSection = Array.from(document.querySelectorAll('*')).find(el => 
    el.textContent.includes('Prerequisite') || el.textContent.includes('Course Requirement')
  );

  if (prereqSection) {
    // Try to extract prerequisite courses
    // This is a basic example - you'll need to adjust based on actual page structure
    const courseList = prereqSection.querySelectorAll('li, tr, .course');
    courseList.forEach(item => {
      const text = item.textContent.trim();
      if (text && text.length > 3) {
        data.prerequisites.push({
          school_name: schoolName || 'Unknown',
          subject: text.split(' ')[0], // First word often subject
          min_grade: null,
          required_credits: null
        });
      }
    });
  }

  // Output JSON
  console.log('=== COPY THIS JSON ===');
  console.log(JSON.stringify(data, null, 2));
  console.log('=====================');
  
  return data;
}

// Run the collection
collectPTCASData();

