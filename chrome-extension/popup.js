const API_URL = 'http://localhost:8000/api';
let authToken = null;
let currentFilename = null;

// DOM Elements
const loginView = document.getElementById('loginView');
const mainView = document.getElementById('mainView');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const scrapeBtn = document.getElementById('scrapeBtn');
const scrapeStatus = document.getElementById('scrapeStatus');
const chatHistory = document.getElementById('chatHistory');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  const result = await chrome.storage.local.get(['token']);
  if (result.token) {
    authToken = result.token;
    showMainView();
  }
});

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Login failed');

    const data = await response.json();
    authToken = data.access_token;
    await chrome.storage.local.set({ token: authToken });
    showMainView();
  } catch (err) {
    loginError.textContent = 'Invalid credentials';
  }
});

// Logout
logoutBtn.addEventListener('click', async () => {
  await chrome.storage.local.remove('token');
  authToken = null;
  loginView.classList.remove('hidden');
  mainView.classList.add('hidden');
  logoutBtn.classList.add('hidden');
});

// Scrape and Upload
scrapeBtn.addEventListener('click', async () => {
  scrapeStatus.textContent = 'Scraping...';
  scrapeBtn.disabled = true;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
      throw new Error('Cannot scrape browser settings or extension pages. Please go to a normal website.');
    }

    scrapeStatus.textContent = 'Uploading to backend...';

    const response = await fetch(`${API_URL}/upload-url`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: tab.url })
    });

    if (!response.ok) throw new Error('Upload failed');
    
    const data = await response.json();
    currentFilename = data.filename;
    
    scrapeStatus.textContent = 'Ready! You can now ask questions.';
    chatInput.disabled = false;
    sendBtn.disabled = false;
    
  } catch (err) {
    console.error(err);
    scrapeStatus.textContent = `Error: ${err.message}`;
    scrapeStatus.style.color = 'var(--error)';
    alert(`Failed to scrape: ${err.message}`);
  } finally {
    scrapeBtn.disabled = false;
  }
});

// Chat
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || !currentFilename) return;

  appendMessage('user', text);
  chatInput.value = '';
  chatInput.disabled = true;
  sendBtn.disabled = true;

  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: text,
        session_id: `ext_${Date.now()}`,
        filename_filter: currentFilename
      })
    });

    if (!response.ok) throw new Error('Chat failed');

    const data = await response.json();
    appendMessage('bot', data.answer);
  } catch (err) {
    appendMessage('bot', `Error: ${err.message}`);
  } finally {
    chatInput.disabled = false;
    sendBtn.disabled = false;
    chatInput.focus();
  }
}

function appendMessage(sender, text) {
  const div = document.createElement('div');
  div.className = `chat-msg msg-${sender}`;
  div.textContent = text;
  chatHistory.appendChild(div);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function showMainView() {
  loginView.classList.add('hidden');
  mainView.classList.remove('hidden');
  logoutBtn.classList.remove('hidden');
}
