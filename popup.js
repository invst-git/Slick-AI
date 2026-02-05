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
            else letterSelect.value = 'E'; // Default fallback
        }
    );

    // 3. Tab Switching Logic
    const tabs = document.querySelectorAll('.tab');
    const sections = document.querySelectorAll('.section');
    const saveBtn = document.getElementById('save'); // Get save button reference

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            // Add to current
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            // Optional: Hide Save button on "Help" tab if you want cleaner UI
            // saveBtn.style.display = targetId === 'help' ? 'none' : 'flex';
        });
    });

    // 4. Save Logic
    document.getElementById('save').addEventListener('click', () => {
        const key = document.getElementById('apiKey').value;
        const prompt = document.getElementById('sysPrompt').value;
        const mod = document.getElementById('modifierKey').value;
        const letter = document.getElementById('triggerLetter').value;
        const memory = document.getElementById('memoryMode').checked;

        // Visual Feedback
        const btn = document.getElementById('save');
        const originalText = btn.innerText;
        btn.innerText = "Saving...";
        
        chrome.storage.sync.set({
            claudeApiKey: key,
            systemPrompt: prompt,
            modifierKey: mod,
            triggerKey: letter,
            memoryMode: memory
        }, () => {
            // Success Animation
            btn.innerText = "Saved";
            btn.style.background = "#10b981"; // Green color
            
            const status = document.getElementById('status-msg');
            status.classList.add('show');
            
            setTimeout(() => {
                status.classList.remove('show');
                btn.innerText = originalText;
                btn.style.background = ""; // Reset color
            }, 1500);
            
            // Notify background/content scripts
            chrome.runtime.sendMessage({ action: "configUpdated" });
        });
    });
});