// Controller for Antigravity Nexus Companion popup

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const tabs = document.querySelectorAll(".tab-btn");
  const panes = document.querySelectorAll(".tab-pane");
  const connectionStatus = document.getElementById("connectionStatus");
  
  // Chat Elements
  const chatMessages = document.getElementById("chatMessages");
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  
  // CLI Elements
  const cliFrame = document.getElementById("cliFrame");
  const cliLoading = document.getElementById("cliLoading");
  
  // Settings Elements
  const settingsForm = document.getElementById("settingsForm");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const toggleKeyBtn = document.getElementById("toggleKeyBtn");
  const hostUrlInput = document.getElementById("hostUrlInput");
  const settingsFeedback = document.getElementById("settingsFeedback");
  
  let config = {
    apiKey: "",
    hostUrl: "https://amazing-grace-hl-bbeaa.web.app"
  };

  // Load configuration from chrome storage
  chrome.storage.sync.get(["apiKey", "hostUrl"], (result) => {
    if (result.apiKey) {
      config.apiKey = result.apiKey;
      apiKeyInput.value = result.apiKey;
    }
    if (result.hostUrl) {
      config.hostUrl = result.hostUrl;
      hostUrlInput.value = result.hostUrl;
    }
    
    // Check connection after loading config
    verifyConnection();
  });

  // Tab Switching Logic
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetTab = tab.getAttribute("data-tab");
      
      tabs.forEach(t => t.classList.remove("active"));
      panes.forEach(p => p.classList.remove("active"));
      
      tab.classList.add("active");
      const targetPane = document.getElementById(targetTab);
      if (targetPane) {
        targetPane.classList.add("active");
      }
      
      // Special actions on tab activation
      if (targetTab === "cli-tab") {
        loadCliIframe();
      }
    });
  });

  // Verify online connectivity
  function verifyConnection() {
    connectionStatus.className = "connection-status";
    connectionStatus.innerHTML = `<span class="pulse-dot"></span> Checking...`;
    
    fetch(`${config.hostUrl}/index.html`, { mode: "no-cors" })
      .then(() => {
        connectionStatus.className = "connection-status online";
        connectionStatus.innerHTML = `<span class="pulse-dot"></span> Online`;
      })
      .catch(() => {
        connectionStatus.className = "connection-status";
        connectionStatus.innerHTML = `<span class="pulse-dot"></span> Offline`;
      });
  }

  // Load Matrix of Conscience iframe
  function loadCliIframe() {
    if (!cliFrame.src || cliFrame.src === "about:blank") {
      const cliUrl = `${config.hostUrl}/arcade/matrix-of-conscience/`;
      cliLoading.style.display = "flex";
      cliFrame.src = cliUrl;
      
      cliFrame.onload = () => {
        cliLoading.style.display = "none";
      };
    }
  }

  // Toggle API Key Visibility
  toggleKeyBtn.addEventListener("click", () => {
    if (apiKeyInput.type === "password") {
      apiKeyInput.type = "text";
      toggleKeyBtn.textContent = "🙈";
    } else {
      apiKeyInput.type = "password";
      toggleKeyBtn.textContent = "👁️";
    }
  });

  // Save Settings
  settingsForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newKey = apiKeyInput.value.trim();
    const newHost = hostUrlInput.value.trim();
    
    chrome.storage.sync.set({
      apiKey: newKey,
      hostUrl: newHost
    }, () => {
      config.apiKey = newKey;
      config.hostUrl = newHost;
      
      settingsFeedback.className = "form-feedback success";
      settingsFeedback.textContent = "CONFIGURATION SAVED";
      
      // Reload iframe with new URL if active
      if (document.getElementById("cli-tab").classList.contains("active")) {
        cliFrame.src = "about:blank";
        loadCliIframe();
      }
      
      verifyConnection();
      
      setTimeout(() => {
        settingsFeedback.textContent = "";
      }, 3000);
    });
  });

  // Textarea Auto-growth
  chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = `${chatInput.scrollHeight}px`;
  });

  // Send Chat Message on enter (without Shift)
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleUserMsgSubmit();
    }
  });

  sendBtn.addEventListener("click", handleUserMsgSubmit);

  function appendMsg(sender, text, type) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${type}`;
    
    const senderSpan = document.createElement("span");
    senderSpan.className = "msg-sender";
    senderSpan.textContent = sender.toUpperCase();
    
    const p = document.createElement("p");
    p.textContent = text;
    
    msgDiv.appendChild(senderSpan);
    msgDiv.appendChild(p);
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function handleUserMsgSubmit() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    appendMsg("You", text, "user-msg");
    chatInput.value = "";
    chatInput.style.height = "auto";
    
    if (!config.apiKey) {
      appendMsg("SYSTEM", "Error: Gemini API Key is missing. Please configure it in Settings.", "system-msg");
      return;
    }
    
    sendToGemini(text);
  }

  async function sendToGemini(userText) {
    const typingBubble = document.createElement("div");
    typingBubble.className = "message ai-msg typing-msg";
    typingBubble.innerHTML = `<span class="msg-sender">ANTIGRAVITY</span><p>Processing...</p>`;
    chatMessages.appendChild(typingBubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.apiKey}`;
    
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: userText }]
            }
          ],
          systemInstruction: {
            parts: [{ text: "You are Antigravity, the user's mobile coding and strategic assistant. Answer questions directly, offer code reviews or support, and keep answers concise and mobile-friendly." }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
          }
        })
      });
      
      const data = await response.json();
      chatMessages.removeChild(typingBubble);
      
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        const replyText = data.candidates[0].content.parts[0].text;
        appendMsg("Antigravity", replyText, "ai-msg");
      } else if (data.error) {
        appendMsg("SYSTEM", `API Error: ${data.error.message}`, "system-msg");
      } else {
        appendMsg("SYSTEM", "Error parsing response from Gemini API.", "system-msg");
      }
    } catch (err) {
      chatMessages.removeChild(typingBubble);
      appendMsg("SYSTEM", `Connection error: ${err.message}`, "system-msg");
    }
  }
});
