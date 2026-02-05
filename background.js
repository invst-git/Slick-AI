// Simple in-memory storage for session history
let chatHistory = []; 

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchExplanation") {
    
    chrome.storage.sync.get(['claudeApiKey', 'systemPrompt', 'memoryMode'], async (data) => {
      
      const apiKey = data.claudeApiKey;
      const userRules = data.systemPrompt || "Explain this concisely.";
      const isMemoryOn = data.memoryMode || false;

      if (!apiKey) {
        sendResponse({ error: "Please enter your API Key in the extension menu." });
        return;
      }

      // RESET history if Memory Mode is OFF
      if (!isMemoryOn) {
        chatHistory = [];
      }

      // Build Messages Array
      const messages = [...chatHistory];
      
      // Add current user query
      // If history is empty, prepend instructions. If history exists, just append text.
      const contentStr = messages.length === 0 
          ? `INSTRUCTIONS: ${userRules}\n\nINPUT: "${request.text}"` 
          : `INPUT: "${request.text}"`;

      messages.push({ role: "user", content: contentStr });

      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
            "anthropic-dangerous-direct-browser-access": "true"
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001", 
            max_tokens: 600,
            messages: messages
          })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "API Error");
        }

        const result = await response.json();
        const aiReply = result.content[0].text;

        // Save to history if memory is ON
        if (isMemoryOn) {
            messages.push({ role: "assistant", content: aiReply });
            // Limit history to last 10 turns to save tokens
            if (messages.length > 10) messages.splice(0, 2); 
            chatHistory = messages;
        }

        sendResponse({ answer: aiReply });

      } catch (error) {
        console.error("Slick Error:", error);
        sendResponse({ error: "Connection failed. Check API Key." });
      }
    });

    return true; 
  }
  
  // Handle config updates
  if (request.action === "configUpdated") {
      // If user toggles memory off, clear history immediately
      chrome.storage.sync.get(['memoryMode'], (data) => {
          if (!data.memoryMode) chatHistory = [];
      });
  }
});