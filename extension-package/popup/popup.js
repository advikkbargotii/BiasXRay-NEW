document.addEventListener('DOMContentLoaded', () => {
  console.log('BiasXRay popup loaded');
  
  // Initialize popup functionality
  initializePopup();
});

function initializePopup() {
  // Handle "Analyze Current Page" button
  const analyzePageBtn = document.getElementById('analyze-page');
  if (analyzePageBtn) {
    analyzePageBtn.addEventListener('click', async () => {
      try {
        // Get the active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Extract visible text from the page
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: extractPageText
        });
        
        const pageText = results[0].result;
        
        if (pageText && pageText.trim().length > 10) {
          try {
            // Inject CSS first
            await chrome.scripting.insertCSS({
              target: { tabId: tab.id },
              files: ['content/overlay.css']
            });
            
            // Then inject the content script
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content/content.js']
            });
            
            // Wait a bit for the script to load, then send the message
            setTimeout(async () => {
              await chrome.tabs.sendMessage(tab.id, {
                action: "analyzeText",
                text: pageText.substring(0, 3000) // Limit to 3000 characters
              });
              
              // Close the popup
              window.close();
            }, 100);
          } catch (error) {
            console.error('Failed to inject content script:', error);
            showError('Failed to analyze page. Please try again.');
          }
        } else {
          showError('No significant text found on this page.');
        }
      } catch (error) {
        console.error('Error analyzing page:', error);
        showError('Failed to analyze page. Please try again.');
      }
    });
  }
  
  // Handle "Open Full App" button
  const openWebappBtn = document.getElementById('open-webapp');
  if (openWebappBtn) {
    openWebappBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://biasxray.org' });
      window.close();
    });
  }
}

// Function to extract text from the current page
function extractPageText() {
  // Remove script and style elements
  const scripts = document.querySelectorAll('script, style, nav, header, footer');
  scripts.forEach(el => el.remove());
  
  // Get main content areas
  const contentSelectors = [
    'main', 'article', '[role="main"]', '.content', '.post', '.article',
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'
  ];
  
  let text = '';
  
  for (const selector of contentSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const el of elements) {
      const elementText = el.innerText || el.textContent;
      if (elementText && elementText.trim().length > 20) {
        text += elementText.trim() + ' ';
      }
    }
    
    // If we have enough text, break
    if (text.length > 1000) break;
  }
  
  // Fallback to body text if no content found
  if (text.length < 100) {
    text = document.body.innerText || document.body.textContent || '';
  }
  
  // Clean up the text
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim()
    .substring(0, 3000); // Limit to 3000 characters
}

// Function to show error messages
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    right: 10px;
    background: #ef4444;
    color: white;
    padding: 12px;
    border-radius: 8px;
    font-size: 0.875rem;
    z-index: 1000;
    animation: slideDown 0.3s ease-out;
  `;
  errorDiv.textContent = message;
  
  document.body.appendChild(errorDiv);
  
  // Remove error after 3 seconds
  setTimeout(() => {
    errorDiv.remove();
  }, 3000);
}
