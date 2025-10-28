// Background service worker for Chromium Terminal extension
// Handles extension icon clicks and opens the terminal in a new tab

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('terminal.html')
  });
});

