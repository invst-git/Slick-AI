chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchExplanation") {
    
    chrome.storage.sync.get(['claudeApiKey', 'systemPrompt'], async (data) => {
      
      const apiKey = data.claudeApiKey;
      // Default fallback if user hasn't set one
      const userRules = data.systemPrompt && data.systemPrompt.trim() !== "" 
                                ? data.systemPrompt 
                                : "Explain this concisely.";

      if (!apiKey) {
        sendResponse({ error: "API Key missing. Go to Extension Options." });
        return;
      }

      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
            // CRITICAL: This header prevents the "Failed to fetch" CORS error
            "anthropic-dangerous-direct-browser-access": "true"
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307", 
            max_tokens: 300,
            // We put the rule inside the USER message to force Haiku to obey
            messages: [
                { 
                  role: "user", 
                  content: `INSTRUCTIONS: ${userRules}\n\n=================\n\nINPUT TEXT:\n"${request.text}"` 
                }
            ]
          })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "API Error");
        }

        const result = await response.json();
        sendResponse({ answer: result.content[0].text });

      } catch (error) {
        console.error("Slick Error:", error);
        sendResponse({ error: "Connection failed. Check API Key or Internet." });
      }
    });

    return true; 
  }
});