// Test script to verify image upload UI functionality
// Run this in browser console at http://localhost:4321/admin/pages

console.log('Testing image upload UI functionality...');

// Find an image placeholder or editable image
const imageElement = document.querySelector('[data-editable="true"][data-field*="image"]');
if (!imageElement) {
  console.error('No editable image element found');
} else {
  console.log('Found editable image element:', imageElement);
  
  // Check if it has an edit button
  const editBtn = imageElement.parentElement?.querySelector('.edit-btn') || 
                  imageElement.querySelector('.edit-btn');
  
  if (!editBtn) {
    console.error('No edit button found for image element');
  } else {
    console.log('Edit button found:', editBtn);
    
    // Test clicking the edit button
    console.log('Simulating edit button click...');
    editBtn.click();
    
    // Check if image edit overlay appears
    setTimeout(() => {
      const overlay = document.querySelector('.image-edit-overlay');
      if (!overlay) {
        console.error('Image edit overlay did not appear');
      } else {
        console.log('Image edit overlay appeared:', overlay);
        
        // Check for change image button
        const changeBtn = overlay.querySelector('.change-image-btn');
        if (!changeBtn) {
          console.error('Change image button not found in overlay');
        } else {
          console.log('Change image button found:', changeBtn);
          console.log('✅ Image upload UI appears to be working correctly');
        }
      }
    }, 100);
  }
}

// Also test CSRF token fetching
console.log('Testing CSRF token fetching...');
fetch('/api/auth/csrf', {
  method: 'GET',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
})
.then(response => {
  console.log('CSRF response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('CSRF tokens received:', data);
  console.log('✅ CSRF token fetching is working');
})
.catch(error => {
  console.error('❌ CSRF token fetching failed:', error);
});