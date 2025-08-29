// Test if VisualEditor component is in DOM
console.log('=== VisualEditor DOM Test ===');

// Check if we're in preview mode
const urlParams = new URLSearchParams(window.location.search);
const hasPreviewParam = urlParams.has('preview');
console.log('URL has preview param:', hasPreviewParam);
console.log('Preview param value:', urlParams.get('preview'));

// Check for VisualEditor script tags
const scriptTags = document.querySelectorAll('script');
const visualEditorScripts = Array.from(scriptTags).filter(script => 
  script.textContent && script.textContent.includes('VisualEditor')
);
console.log('Total script tags:', scriptTags.length);
console.log('VisualEditor script tags found:', visualEditorScripts.length);

// Log details of VisualEditor scripts
visualEditorScripts.forEach((script, i) => {
  console.log(`VisualEditor script ${i}:`, {
    hasContent: !!script.textContent,
    contentLength: script.textContent ? script.textContent.length : 0,
    containsClass: script.textContent ? script.textContent.includes('class VisualEditor') : false,
    containsWindow: script.textContent ? script.textContent.includes('window.VisualEditor') : false
  });
});

// Check for any elements with VisualEditor-related classes or IDs
const visualEditorElements = document.querySelectorAll('[class*="visual-editor"], [id*="visual-editor"], [class*="edit-btn"]');
console.log('VisualEditor-related elements:', visualEditorElements.length);

// Check if the component rendered at all
const componentMarkers = document.querySelectorAll('*');
let hasVisualEditorComment = false;
componentMarkers.forEach(el => {
  if (el.nodeType === Node.COMMENT_NODE && el.textContent.includes('VisualEditor')) {
    hasVisualEditorComment = true;
  }
});

console.log('Has VisualEditor HTML comments:', hasVisualEditorComment);
console.log('=== DOM Test Complete ===');