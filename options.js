// Load saved settings when the page opens
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['claudeApiKey', 'systemPrompt'], (items) => {
    if (items.claudeApiKey) document.getElementById('apiKey').value = items.claudeApiKey;
    if (items.systemPrompt) document.getElementById('sysPrompt').value = items.systemPrompt;
  });
});

// Save settings when button is clicked
document.getElementById('save').addEventListener('click', () => {
  const key = document.getElementById('apiKey').value;
  const prompt = document.getElementById('sysPrompt').value;

  chrome.storage.sync.set({
    claudeApiKey: key,
    systemPrompt: prompt
  }, () => {
    const status = document.getElementById('status');
    status.textContent = 'Options saved successfully!';
    setTimeout(() => status.textContent = '', 2000);
  });
});