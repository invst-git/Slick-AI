let currentTooltip = null;
let currentRange = null;
let config = {
    modifier: 'Shift',
    key: 'E'
};

// Load config immediately on load
chrome.storage.sync.get(['modifierKey', 'triggerKey'], (items) => {
    if (items.modifierKey) config.modifier = items.modifierKey;
    if (items.triggerKey) config.key = items.triggerKey;
});

// Listen for updates from popup
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "configUpdated") {
        chrome.storage.sync.get(['modifierKey', 'triggerKey'], (items) => {
            if (items.modifierKey) config.modifier = items.modifierKey;
            if (items.triggerKey) config.key = items.triggerKey;
        });
    }
});

document.addEventListener('keydown', async (event) => {
    // Dynamic Key Check
    const isModPressed = event.getModifierState(config.modifier);
    const isKeyMatch = event.key.toUpperCase() === config.key.toUpperCase();

    if (isModPressed && isKeyMatch) {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (!selectedText) return;

        if (currentTooltip) removeTooltip();
        currentRange = selection.getRangeAt(0);

        // Initial "Thinking" state
        updateTooltipPosition(true, "Processing...");

        chrome.runtime.sendMessage(
            { action: "fetchExplanation", text: selectedText },
            (response) => {
                if (response.error) {
                    updateTooltipContent("Error: " + response.error);
                } else {
                    updateTooltipContent(response.answer);
                }
            }
        );
    }
});

// ... Scroll and Resize listeners remain the same ...
window.addEventListener('scroll', () => { if (currentTooltip && currentRange) updateTooltipPosition(false); }, true);
window.addEventListener('resize', () => { if (currentTooltip && currentRange) updateTooltipPosition(false); }, true);
document.addEventListener('mousedown', (e) => { if (currentTooltip && !currentTooltip.contains(e.target)) removeTooltip(); });

function removeTooltip() {
    if (currentTooltip) currentTooltip.remove();
    currentTooltip = null;
    currentRange = null;
}

function updateTooltipPosition(isNew, textContent = "") {
    const rect = currentRange.getBoundingClientRect();
    if (rect.top === 0 && rect.bottom === 0) {
        if (currentTooltip) currentTooltip.style.display = 'none';
        return;
    }

    let host;
    if (isNew) {
        host = document.createElement('div');
        host.style.position = 'fixed'; 
        host.style.zIndex = '2147483647';
        document.body.appendChild(host);
        
        const shadow = host.attachShadow({ mode: 'open' });
        
        // ULTRA STEALTH CSS
        const style = document.createElement('style');
        style.textContent = `
          .slick-box {
            /* Much more transparent (0.65) with strong blur */
            background: rgba(10, 10, 10, 0.65); 
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            
            color: rgba(255, 255, 255, 0.9);
            padding: 14px 18px;
            border-radius: 12px;
            
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            line-height: 1.5;
            font-weight: 400;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5); /* Text shadow ensures readability on transparent bg */
            
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            
            width: max-content;
            max-width: 350px;
            
            opacity: 0;
            transform: translateY(8px);
            transition: opacity 0.2s ease, transform 0.2s ease;
          }
          .slick-box.visible { opacity: 1; transform: translateY(0); }
          .loading { color: #aaa; display: flex; align-items: center; gap: 8px;}
          .dot { width: 5px; height: 5px; background: #ccc; border-radius: 50%; animation: pulse 1s infinite;}
          @keyframes pulse { 0% {opacity:0.4} 50% {opacity:1} 100% {opacity:0.4} }
        `;
        shadow.appendChild(style);

        const div = document.createElement('div');
        div.className = 'slick-box';
        div.innerHTML = `<div class="loading"><div class="dot"></div>${textContent}</div>`;
        shadow.appendChild(div);
        
        currentTooltip = host;
        requestAnimationFrame(() => div.classList.add('visible'));
    } else {
        host = currentTooltip;
        if (host.style.display === 'none') host.style.display = 'block';
    }

    const tooltipHeight = host.offsetHeight || 50;
    let top = rect.bottom + 12;
    let left = rect.left;

    if (top + tooltipHeight > window.innerHeight) top = rect.top - tooltipHeight - 12;
    if (left + 350 > window.innerWidth) left = window.innerWidth - 370;

    host.style.top = `${top}px`;
    host.style.left = `${left}px`;
}

function updateTooltipContent(text) {
    if (!currentTooltip || !currentTooltip.shadowRoot) return;
    const box = currentTooltip.shadowRoot.querySelector('.slick-box');
    
    // Markdown formatting
    const formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.1); padding:2px 4px; border-radius:3px;">$1</code>')
        .replace(/\n/g, '<br>');

    box.innerHTML = formatted;
    updateTooltipPosition(false);
}