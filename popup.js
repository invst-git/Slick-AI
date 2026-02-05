document.addEventListener('DOMContentLoaded', () => {
    // 1. Populate Letter Dropdown
    const letterSelect = document.getElementById('triggerLetter');
    for (let i = 65; i <= 90; i++) {
        const char = String.fromCharCode(i);
        const opt = document.createElement('option');
        opt.value = char;
        opt.innerText = char;
        letterSelect.appendChild(opt);
    }

    // 2. Load Saved Data
    chrome.storage.sync.get(
        ['claudeApiKey', 'systemPrompt', 'modifierKey', 'triggerKey', 'memoryMode'], 
        (items) => {
            if (items.claudeApiKey) document.getElementById('apiKey').value = items.claudeApiKey;
            if (items.systemPrompt) document.getElementById('sysPrompt').value = items.systemPrompt;
            if (items.modifierKey) document.getElementById('modifierKey').value = items.modifierKey;
            if (items.triggerKey) letterSelect.value = items.triggerKey;
            if (items.memoryMode) document.getElementById('memoryMode').checked = items.memoryMode;
            else letterSelect.value = 'E'; // Default
        }
    );

    // 3. Tab Switching Logic
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.target).classList.add('active');
        });
    });

    // 4. Save Logic
    document.getElementById('save').addEventListener('click', () => {
        const key = document.getElementById('apiKey').value;
        const prompt = document.getElementById('sysPrompt').value;
        const mod = document.getElementById('modifierKey').value;
        const letter = document.getElementById('triggerLetter').value;
        const memory = document.getElementById('memoryMode').checked;

        chrome.storage.sync.set({
            claudeApiKey: key,
            systemPrompt: prompt,
            modifierKey: mod,
            triggerKey: letter,
            memoryMode: memory
        }, () => {
            const status = document.getElementById('status');
            status.textContent = 'Settings Saved!';
            setTimeout(() => status.textContent = '', 2000);
            
            // Notify active tabs to update their config immediately
            chrome.runtime.sendMessage({ action: "configUpdated" });
        });
    });
});