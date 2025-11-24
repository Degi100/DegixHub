// Background service worker for DegixHub extension

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('DegixHub extension installed');

    // Open options page or welcome page on first install
    chrome.tabs.create({
      url: 'popup.html'
    });
  } else if (details.reason === 'update') {
    console.log('DegixHub extension updated');
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SAVE_LINK') {
    handleSaveLink(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }

  if (request.type === 'GET_CURRENT_TAB') {
    getCurrentTabInfo()
      .then(tab => sendResponse({ success: true, data: tab }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Get current tab information
async function getCurrentTabInfo() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return {
    title: tab.title,
    url: tab.url,
    favIconUrl: tab.favIconUrl,
  };
}

// Handle saving link to DegixHub
async function handleSaveLink(data) {
  const { apiUrl, sessionId, name, url, category, description } = data;

  const response = await fetch(`${apiUrl}/api/trpc/links.create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `auth_session=${sessionId}`,
    },
    credentials: 'include',
    body: JSON.stringify({
      name,
      url,
      category,
      description,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to save link');
  }

  return await response.json();
}

// Handle keyboard shortcuts (if configured)
chrome.commands?.onCommand?.addListener((command) => {
  if (command === 'save-current-page') {
    chrome.action.openPopup();
  }
});

// Keep service worker alive (Manifest V3 requirement)
chrome.runtime.onStartup.addListener(() => {
  console.log('DegixHub extension started');
});

// Handle alarm events (for periodic tasks if needed)
chrome.alarms?.onAlarm?.addListener((alarm) => {
  console.log('Alarm triggered:', alarm.name);
  // Can be used for syncing, notifications, etc.
});

console.log('DegixHub background service worker loaded');
