let currentTooltip = null;
let currentRange = null; 

document.addEventListener('keydown', async (event) => {
  if (event.shiftKey && event.key.toLowerCase() === 'e') {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (!selectedText) return;

    if (currentTooltip) removeTooltip();
    currentRange = selection.getRangeAt(0);

    // Initial "Thinking" state
    updateTooltipPosition(true, "Thinking...");

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

// Scroll Tracker - Keeps popup stuck to text even on Google Forms
window.addEventListener('scroll', () => {
    if (currentTooltip && currentRange) updateTooltipPosition(false);
}, true);

window.addEventListener('resize', () => {
    if (currentTooltip && currentRange) updateTooltipPosition(false);
}, true);

document.addEventListener('mousedown', (e) => {
    if (currentTooltip && !currentTooltip.contains(e.target)) {
        removeTooltip();
    }
});

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
        
        const style = document.createElement('style');
        style.textContent = `
          .slick-box {
            background: rgba(20, 20, 20, 0.85); /* Darker for readability */
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            color: rgba(255, 255, 255, 0.95);
            padding: 12px 16px;
            border-radius: 8px;
            font-family: -apple-system, system-ui, sans-serif;
            font-size: 13px;
            line-height: 1.4;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            width: max-content;
            max-width: 400px; /* Prevents it from being too wide */
            opacity: 0;
            transform: translateY(4px);
            transition: opacity 0.2s, transform 0.2s;
          }
          .slick-box.visible { opacity: 1; transform: translateY(0); }
          .loading { color: #bbb; display: flex; align-items: center; gap: 8px;}
          .dot { width: 6px; height: 6px; background: #bbb; border-radius: 50%; animation: pulse 1s infinite;}
          @keyframes pulse { 0% {opacity:0.3} 50% {opacity:1} 100% {opacity:0.3} }
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

    // Positioning Logic
    const tooltipHeight = host.offsetHeight || 50;
    // Position below text by default
    let top = rect.bottom + 10;
    let left = rect.left;

    // If box goes off bottom of screen, flip it to the top
    if (top + tooltipHeight > window.innerHeight) {
        top = rect.top - tooltipHeight - 10;
    }

    host.style.top = `${top}px`;
    host.style.left = `${left}px`;
}

function updateTooltipContent(text) {
    if (!currentTooltip || !currentTooltip.shadowRoot) return;
    const box = currentTooltip.shadowRoot.querySelector('.slick-box');
    
    // Markdown formatting
    const formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    box.innerHTML = formatted;
    
    // Re-check position in case the content size changed
    updateTooltipPosition(false);
}