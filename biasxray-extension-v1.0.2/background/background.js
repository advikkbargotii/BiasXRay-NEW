// Create context menu item when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "analyzeText",
    title: "Analyze Text with BiasXRay",
    contexts: ["selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "analyzeText" && info.selectionText) {
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
      setTimeout(() => {
        chrome.tabs.sendMessage(tab.id, {
          action: "analyzeText",
          text: info.selectionText
        });
      }, 100);
    } catch (error) {
      console.error('Failed to inject content script:', error);
    }
  }
});
