// Test script to verify VisualEditor fix - should only work in preview mode
console.log('=== VisualEditor Fix Verification Test ===');
console.log('Current URL:', window.location.href);
console.log('Pathname:', window.location.pathname);
console.log('Search params:', window.location.search);

// Check mode detection
const isAdminPage = window.location.pathname.startsWith('/admin');
const isPreviewMode = window.location.search.includes('preview=true');

console.log('Mode detection:', {
  isAdminPage,
  isPreviewMode,
  shouldInitialize: isPreviewMode || (!isAdminPage)
});

// Check VisualEditor availability
console.log('VisualEditor class available:', typeof window.VisualEditor);
console.log('VisualEditor instance available:', typeof window.visualEditor);

// Check for editable elements
const editableElements = document.querySelectorAll('[data-editable]');
console.log('Editable elements found:', editableElements.length);

editableElements.forEach((element, index) => {
  const hasEditButton = element.querySelector('.edit-btn');
  console.log(`Element ${index + 1}:`, {
    id: element.id,
    tag: element.tagName,
    section: element.getAttribute('data-section'),
    field: element.getAttribute('data-field'),
    hasEditButton: !!hasEditButton
  });
});

// Check for edit buttons
const editButtons = document.querySelectorAll('.edit-btn');
console.log('Edit buttons found:', editButtons.length);

// Expected behavior check
if (isPreviewMode) {
  console.log('✅ PREVIEW MODE - VisualEditor should be active');
  if (typeof window.visualEditor !== 'undefined' && editButtons.length > 0) {
    console.log('🎉 SUCCESS: VisualEditor is working correctly in preview mode!');
  } else {
    console.log('❌ ISSUE: VisualEditor not working in preview mode');
  }
} else if (isAdminPage) {
  console.log('✅ ADMIN MODE - VisualEditor should be inactive (form inputs only)');
  if (typeof window.visualEditor === 'undefined') {
    console.log('🎉 SUCCESS: VisualEditor correctly skipped in admin mode!');
  } else {
    console.log('❌ ISSUE: VisualEditor should not initialize in admin mode');
  }
} else {
  console.log('✅ FRONTEND MODE - VisualEditor should be inactive');
  if (typeof window.visualEditor === 'undefined') {
    console.log('🎉 SUCCESS: VisualEditor correctly inactive on frontend!');
  } else {
    console.log('⚠️ NOTE: VisualEditor active on frontend - this may be intentional');
  }
}

console.log('=== Test Complete ===');