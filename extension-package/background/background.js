// Create context menu item when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "analyzeText",
    title: "Analyze Text with BiasXRay",
    contexts: ["selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "analyzeText" && info.selectionText) {
    // Send the selected text to the content script
    chrome.tabs.sendMessage(tab.id, {
      action: "analyzeText",
      text: info.selectionText
    });
  }
}); 