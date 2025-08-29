// VisualEditor class definition - shared across components
class VisualEditor {
  constructor() {
    this.editButtons = [];
    this.init();
  }

  init() {
    console.log('Initializing VisualEditor...');
    this.addEditButtons();
  }

  addEditButtons() {
    // Find all elements with data-editable attribute
    const editableElements = document.querySelectorAll('[data-editable]');
    console.log(`Found ${editableElements.length} editable elements`);

    editableElements.forEach(element => {
      // Skip if already has an edit button
      if (element.querySelector('.edit-btn')) {
        return;
      }

      const editButton = this.createEditButton(element);
      if (editButton) {
        this.editButtons.push(editButton);
      }
    });
  }

  createEditButton(element) {
    const sectionId = element.getAttribute('data-section-id');
    const fieldPath = element.getAttribute('data-field-path');
    const editType = element.getAttribute('data-edit-type');

    if (!sectionId || !fieldPath) {
      console.warn('Missing required attributes for edit button:', element);
      return null;
    }

    // Create edit button
    const button = document.createElement('button');
    button.className = 'edit-btn';
    button.innerHTML = editType === 'image' ? '📷' : '✏️';
    button.title = `Edit ${fieldPath}`;
    
    // Position the button
    element.style.position = 'relative';
    button.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(59, 130, 246, 0.9);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px;
      cursor: pointer;
      font-size: 14px;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;

    // Add hover effect
    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(37, 99, 235, 0.9)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(59, 130, 246, 0.9)';
    });

    // Add click handler
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleEdit(sectionId, fieldPath, editType, element);
    });

    element.appendChild(button);
    return button;
  }

  handleEdit(sectionId, fieldPath, editType, element) {
    console.log('Edit clicked:', { sectionId, fieldPath, editType });
    
    if (editType === 'image') {
      this.handleImageEdit(sectionId, fieldPath, element);
    } else {
      this.handleTextEdit(sectionId, fieldPath, element);
    }
  }

  handleImageEdit(sectionId, fieldPath, element) {
    // Create file input for image upload
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const formData = new FormData();
          formData.append('image', file);
          
          const response = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData,
            headers: {
              'X-Requested-With': 'XMLHttpRequest'
            }
          });
          
          const result = await response.json();
          
          if (result.success) {
            // Update the image source
            const img = element.querySelector('img');
            if (img) {
              img.src = result.url;
            }
            
            // Save the change
            await this.saveContent(sectionId, fieldPath, result.url);
            console.log('Image updated successfully');
          } else {
            alert('Upload failed: ' + (result.error || 'Unknown error'));
          }
        } catch (error) {
          console.error('Upload error:', error);
          alert('Upload failed: ' + error.message);
        }
      }
      
      // Clean up
      document.body.removeChild(fileInput);
    });
    
    document.body.appendChild(fileInput);
    fileInput.click();
  }

  handleTextEdit(sectionId, fieldPath, element) {
    const currentText = element.textContent || element.value || '';
    const newText = prompt(`Edit ${fieldPath}:`, currentText);
    
    if (newText !== null && newText !== currentText) {
      // Update the element
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.value = newText;
      } else {
        element.textContent = newText;
      }
      
      // Save the change
      this.saveContent(sectionId, fieldPath, newText);
    }
  }

  async saveContent(sectionId, fieldPath, value) {
    try {
      const response = await fetch('/api/content/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          sectionId,
          fieldPath,
          value
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('Content saved successfully');
        // Show success feedback
        this.showFeedback('Saved!', 'success');
      } else {
        console.error('Save failed:', result.error);
        this.showFeedback('Save failed', 'error');
      }
    } catch (error) {
      console.error('Save error:', error);
      this.showFeedback('Save failed', 'error');
    }
  }

  showFeedback(message, type) {
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      border-radius: 4px;
      color: white;
      font-weight: bold;
      z-index: 10000;
      ${type === 'success' ? 'background: #10b981;' : 'background: #ef4444;'}
    `;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.parentNode.removeChild(feedback);
      }
    }, 3000);
  }
}

// Expose VisualEditor class globally for testing and external access (only if not already defined)
if (!window.VisualEditor) {
  window.VisualEditor = VisualEditor;
}

// Initialize with proper timing to ensure all elements are loaded
function initializeVisualEditor() {
  // Only initialize in preview mode, not in admin mode
  const isAdminPage = window.location.pathname.startsWith('/admin');
  const isPreviewMode = window.location.search.includes('preview=true');
  
  console.log('VisualEditor initialization check:', {
    isAdminPage,
    isPreviewMode,
    pathname: window.location.pathname,
    search: window.location.search
  });
  
  if (isAdminPage && !isPreviewMode) {
    console.log('Skipping VisualEditor initialization - in admin mode');
    return;
  }
  
  if (isPreviewMode || (!isAdminPage)) {
    console.log('Initializing VisualEditor for preview/frontend mode...');
    if (!window.visualEditor) {
      window.visualEditor = new VisualEditor();
    }
  }
}

// Use multiple strategies to ensure proper initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Add a small delay to ensure all elements are rendered
    setTimeout(initializeVisualEditor, 100);
  });
} else if (document.readyState === 'interactive') {
  // DOM is loaded but resources might still be loading
  setTimeout(initializeVisualEditor, 100);
} else {
  // Document is fully loaded
  initializeVisualEditor();
}

// Also initialize on window load as a fallback
window.addEventListener('load', () => {
  if (!window.visualEditor && (window.location.search.includes('preview=true') || !window.location.pathname.startsWith('/admin'))) {
    console.log('Fallback initialization of VisualEditor');
    initializeVisualEditor();
  }
});