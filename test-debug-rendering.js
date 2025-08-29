// Test if debug rendering is working
console.log('=== Debug Rendering Test ===');

// Check for our debug message in console
console.log('Looking for debug script output...');

// Check if debug script ran
const debugScripts = Array.from(document.querySelectorAll('script')).filter(script => 
  script.textContent && script.textContent.includes('VisualEditor should be rendered')
);
console.log('Debug scripts found:', debugScripts.length);

// Check for HTML comments with debug info
const walker = document.createTreeWalker(
  document.body,
  NodeFilter.SHOW_COMMENT,
  null,
  false
);

let debugComments = [];
let node;
while (node = walker.nextNode()) {
  if (node.textContent.includes('Debug: isPreview')) {
    debugComments.push(node.textContent);
  }
}

console.log('Debug comments found:', debugComments.length);
debugComments.forEach(comment => {
  console.log('Debug comment:', comment);
});

// Check if VisualEditor component exists in DOM
const visualEditorScripts = Array.from(document.querySelectorAll('script')).filter(script => 
  script.textContent && script.textContent.includes('class VisualEditor')
);
console.log('VisualEditor class scripts found:', visualEditorScripts.length);

// Check page source for VisualEditor
const pageSource = document.documentElement.outerHTML;
const hasVisualEditorInSource = pageSource.includes('VisualEditor');
console.log('VisualEditor found in page source:', hasVisualEditorInSource);

console.log('=== Debug Rendering Test Complete ===');