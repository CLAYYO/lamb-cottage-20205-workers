// Test script to check if Hero background image edit buttons are appearing
console.log('=== Testing Hero Background Image Edit Buttons ===');

// Wait for page to load
setTimeout(() => {
  // Check if VisualEditor is available
  console.log('VisualEditor available:', typeof window.VisualEditor !== 'undefined');
  console.log('visualEditor instance:', typeof window.visualEditor !== 'undefined');
  
  // Find Hero background image
  const heroImage = document.querySelector('[data-section="hero"][data-field="backgroundImage.src"]');
  console.log('Hero background image found:', !!heroImage);
  
  if (heroImage) {
    console.log('Hero image details:', {
      id: heroImage.id,
      src: heroImage.src,
      dataSection: heroImage.getAttribute('data-section'),
      dataField: heroImage.getAttribute('data-field'),
      dataEditable: heroImage.getAttribute('data-editable')
    });
    
    // Check if edit button exists
    const editButton = heroImage.querySelector('.edit-btn');
    console.log('Edit button found:', !!editButton);
    
    if (editButton) {
      console.log('✅ SUCCESS: Edit button is present on Hero background image');
    } else {
      console.log('❌ ISSUE: Edit button not found on Hero background image');
      
      // Try to manually trigger VisualEditor initialization
      if (window.visualEditor) {
        console.log('Attempting to manually add edit button...');
        window.visualEditor.addEditButton(heroImage);
        
        // Check again
        const newEditButton = heroImage.querySelector('.edit-btn');
        console.log('Edit button after manual addition:', !!newEditButton);
      }
    }
  } else {
    console.log('❌ CRITICAL: Hero background image not found');
    
    // List all data-editable elements
    const editableElements = document.querySelectorAll('[data-editable]');
    console.log('All data-editable elements found:', editableElements.length);
    editableElements.forEach((el, i) => {
      console.log(`Element ${i + 1}:`, {
        tagName: el.tagName,
        id: el.id,
        dataSection: el.getAttribute('data-section'),
        dataField: el.getAttribute('data-field')
      });
    });
  }
}, 2000);
