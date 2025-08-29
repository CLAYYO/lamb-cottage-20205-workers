// Final verification test for VisualEditor after TypeScript fixes
console.log('=== Final VisualEditor Verification Test ===');
console.log('Document ready state:', document.readyState);
console.log('Current URL:', window.location.href);
console.log('URL search params:', window.location.search);

// Check if we're in preview mode
const urlParams = new URLSearchParams(window.location.search);
const isPreview = urlParams.has('preview');
console.log('Preview mode detected:', isPreview);

// Check for debug output in HTML
const debugComment = document.documentElement.innerHTML.match(/<!-- DEBUG: isPreview = (.*?) -->/)?.[1];
console.log('Debug comment isPreview value:', debugComment);

// Check VisualEditor availability
console.log('window.VisualEditor available:', typeof window.VisualEditor);
console.log('window.visualEditor instance:', typeof window.visualEditor);

// Check for VisualEditor script tags
const allScripts = Array.from(document.querySelectorAll('script'));
const visualEditorScripts = allScripts.filter(script => 
  script.textContent && script.textContent.includes('VisualEditor')
);
console.log('VisualEditor script tags found:', visualEditorScripts.length);

if (visualEditorScripts.length > 0) {
  console.log('First VisualEditor script content preview:', 
    visualEditorScripts[0].textContent.substring(0, 200) + '...');
}

// Check for editable elements
const editableElements = document.querySelectorAll('[data-editable]');
console.log('Elements with data-editable:', editableElements.length);

editableElements.forEach((element, index) => {
  console.log(`Editable element ${index + 1}:`, {
    tag: element.tagName,
    id: element.id,
    classes: element.className,
    editableType: element.getAttribute('data-editable'),
    hasEditButton: !!element.querySelector('.edit-button')
  });
});

// Check for edit buttons
const editButtons = document.querySelectorAll('.edit-button');
console.log('Edit buttons found:', editButtons.length);

// Try manual initialization if VisualEditor exists but no buttons
if (typeof window.VisualEditor !== 'undefined' && editButtons.length === 0) {
  console.log('Attempting manual VisualEditor initialization...');
  try {
    if (typeof window.visualEditor === 'undefined') {
      window.visualEditor = new window.VisualEditor();
    }
    window.visualEditor.init();
    
    // Check again after manual init
    setTimeout(() => {
      const newEditButtons = document.querySelectorAll('.edit-button');
      console.log('Edit buttons after manual init:', newEditButtons.length);
    }, 500);
  } catch (error) {
    console.error('Manual initialization failed:', error);
  }
}

// Final status
console.log('=== Final Status ===');
console.log('✓ Preview mode:', isPreview);
console.log('✓ VisualEditor class:', typeof window.VisualEditor !== 'undefined');
console.log('✓ VisualEditor instance:', typeof window.visualEditor !== 'undefined');
console.log('✓ Editable elements:', editableElements.length);
console.log('✓ Edit buttons:', document.querySelectorAll('.edit-button').length);

if (isPreview && typeof window.VisualEditor !== 'undefined' && document.querySelectorAll('.edit-button').length > 0) {
  console.log('🎉 SUCCESS: VisualEditor is working correctly!');
} else {
  console.log('❌ ISSUE: VisualEditor still not working properly');
}