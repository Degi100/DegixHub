// DOM Elements
const authSection = document.getElementById('authSection');
const formSection = document.getElementById('formSection');
const loading = document.getElementById('loading');
const status = document.getElementById('status');

// Auth elements
const apiUrlInput = document.getElementById('apiUrl');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');

// Form elements
const linkNameInput = document.getElementById('linkName');
const linkUrlInput = document.getElementById('linkUrl');
const linkCategoryInput = document.getElementById('linkCategory');
const linkDescriptionInput = document.getElementById('linkDescription');
const saveBtn = document.getElementById('saveBtn');
const logoutBtn = document.getElementById('logoutBtn');
const openDashboardLink = document.getElementById('openDashboard');

// State
let apiUrl = '';
let sessionId = '';

// Show status message
function showStatus(message, type = 'info') {
  status.textContent = message;
  status.className = `status ${type}`;
  setTimeout(() => {
    status.className = 'status';
  }, 3000);
}

// Show loading
function showLoading(show = true) {
  if (show) {
    loading.classList.add('active');
    authSection.classList.remove('active');
    formSection.classList.remove('active');
  } else {
    loading.classList.remove('active');
  }
}

// Check authentication on load
async function checkAuth() {
  showLoading(true);

  const storage = await chrome.storage.local.get(['apiUrl', 'sessionId']);

  if (storage.apiUrl && storage.sessionId) {
    apiUrl = storage.apiUrl;
    sessionId = storage.sessionId;

    // Verify session is still valid
    try {
      const response = await fetch(`${apiUrl}/api/trpc/links.getAll`, {
        method: 'GET',
        headers: {
          'Cookie': `auth_session=${sessionId}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        showLoading(false);
        showForm();
        await fillCurrentTab();
        return;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  }

  showLoading(false);
  authSection.classList.add('active');

  // Set API URL from storage if available
  if (storage.apiUrl) {
    apiUrlInput.value = storage.apiUrl;
  }
}

// Show form section
function showForm() {
  authSection.classList.remove('active');
  formSection.classList.add('active');
  openDashboardLink.href = apiUrl;
}

// Fill form with current tab data
async function fillCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      linkNameInput.value = tab.title || '';
      linkUrlInput.value = tab.url || '';
    }
  } catch (error) {
    console.error('Error getting current tab:', error);
  }
}

// Login
loginBtn.addEventListener('click', async () => {
  const url = apiUrlInput.value.trim();
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!url || !username || !password) {
    showStatus('Please fill in all fields', 'error');
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = 'Logging in...';

  try {
    const response = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();

    // Extract session cookie
    const cookies = response.headers.get('set-cookie');
    let extractedSessionId = '';

    if (cookies) {
      const match = cookies.match(/auth_session=([^;]+)/);
      if (match) {
        extractedSessionId = match[1];
      }
    }

    // If we can't extract from headers, try the response body
    if (!extractedSessionId && data.sessionId) {
      extractedSessionId = data.sessionId;
    }

    if (!extractedSessionId) {
      throw new Error('No session ID received');
    }

    // Store credentials
    apiUrl = url;
    sessionId = extractedSessionId;

    await chrome.storage.local.set({
      apiUrl: url,
      sessionId: extractedSessionId,
    });

    showStatus('Login successful!', 'success');
    showForm();
    await fillCurrentTab();
  } catch (error) {
    showStatus(error.message || 'Login failed', 'error');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';
  }
});

// Save link
saveBtn.addEventListener('click', async () => {
  const name = linkNameInput.value.trim();
  const url = linkUrlInput.value.trim();
  const category = linkCategoryInput.value;
  const description = linkDescriptionInput.value.trim();

  if (!name || !url) {
    showStatus('Name and URL are required', 'error');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
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
        description: description || undefined,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Session expired
        await chrome.storage.local.remove(['sessionId']);
        authSection.classList.add('active');
        formSection.classList.remove('active');
        throw new Error('Session expired. Please login again.');
      }
      throw new Error('Failed to save link');
    }

    showStatus('Link saved successfully!', 'success');

    // Clear form
    linkNameInput.value = '';
    linkUrlInput.value = '';
    linkDescriptionInput.value = '';
    linkCategoryInput.value = 'General';

    // Auto-fill next tab after a short delay
    setTimeout(fillCurrentTab, 1000);
  } catch (error) {
    showStatus(error.message || 'Failed to save link', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Link';
  }
});

// Logout
logoutBtn.addEventListener('click', async () => {
  await chrome.storage.local.remove(['sessionId']);
  sessionId = '';
  authSection.classList.add('active');
  formSection.classList.remove('active');
  showStatus('Logged out successfully', 'info');
});

// Open dashboard
openDashboardLink.addEventListener('click', (e) => {
  e.preventDefault();
  if (apiUrl) {
    chrome.tabs.create({ url: apiUrl });
  }
});

// Initialize
checkAuth();
