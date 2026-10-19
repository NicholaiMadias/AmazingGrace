/**
 * ============================================================================
 * AmazingGrace Nexus — Google Apps Script Sheet & Key Master Relay
 * ============================================================================
 * Bound to Google Sheets and deployed as a Web App to service:
 * 1. Key Master Vault Secret Rotation (vault-tool.js / npm run sync-key)
 * 2. AmazingGrace Console on /matrix (Anti-Gravity, Gemini CLI, Drive State Sync)
 * 3. GitHub repository dispatch & script synchronization
 */

const REPO_OWNER = "NicholaiMadias";
const REPO_NAME = "Amazing-Grace";

/**
 * Triggered when the bound Google Sheet opens.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('⬡ AmazingGrace Nexus')
    .addItem('📊 Initialize Sheet Tabs', 'initSheetTabs')
    .addItem('🔑 Key Master Secret Sync', 'syncKeyMasterFromSheet')
    .addItem('🤖 Gemini CLI Ping', 'testGeminiCLI')
    .addItem('🌐 Verify GitHub Connection', 'verifyGitHubConnection')
    .addToUi();
}

/**
 * Initializes required tabs and headers in the Google Sheet.
 */
function initSheetTabs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  getOrCreateSheet(ss, "Vault Audit Log", ["Timestamp", "Action", "Feature / Context", "Status", "Details"]);
  getOrCreateSheet(ss, "CLI Dispatch Log", ["Timestamp", "Tool Mode", "Command / Prompt", "Response"]);
  SpreadsheetApp.getUi().alert("✅ AmazingGrace Nexus tabs initialized successfully.");
}

/**
 * Web App GET endpoint: health check & metadata.
 */
function doGet(e) {
  const output = {
    status: "online",
    system: "AmazingGrace Nexus Sheet Relay",
    version: "2.1.0",
    timestamp: new Date().toISOString(),
    modes: ["ANTIGRAVITY", "CLI_DISPATCH", "DRIVE_SYNC", "update_matrix"]
  };
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Web App POST endpoint: dispatches Key Master and Console requests.
 */
function doPost(e) {
  try {
    const rawData = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    const data = JSON.parse(rawData);
    const action = data.action || "UNKNOWN";

    // 1. Key Master Vault Sync (from vault-tool.js)
    if (action === "update_matrix") {
      return handleVaultUpdate(data);
    }

    // 2. Anti-Gravity Setup
    if (action === "ANTIGRAVITY") {
      return handleAntiGravitySetup(data);
    }

    // 3. Gemini Command Line Dispatch
    if (action === "CLI_DISPATCH") {
      return handleCliDispatch(data);
    }

    // 4. Google Drive State Sync
    if (action === "DRIVE_SYNC") {
      return handleDriveSync(data);
    }

    return respondJson({ error: `Unrecognized action: ${action}` }, 400);
  } catch (err) {
    Logger.log("doPost Error: " + err.message);
    return respondJson({ error: err.message }, 500);
  }
}

/**
 * Handles Key Master secret synchronization.
 */
function handleVaultUpdate(data) {
  const feature = data.feature || "General";
  const secretValue = data.value || "";
  const authKey = data.authKey || "";

  const expectedAuth = PropertiesService.getScriptProperties().getProperty("VAULT_ACCESS_KEY");
  if (expectedAuth && authKey !== expectedAuth) {
    logToSheet("Vault Audit Log", ["update_matrix", feature, "REJECTED", "Invalid VAULT_ACCESS_KEY"]);
    return respondJson({ error: "Unauthorized: Invalid vault auth key" }, 401);
  }

  // Store in script properties
  if (feature.toUpperCase().includes("GEMINI") || feature.toUpperCase().includes("GOOGLE")) {
    PropertiesService.getScriptProperties().setProperty("GEMINI_API_KEY", secretValue);
    PropertiesService.getScriptProperties().setProperty("GOOGLE_GENAI_API_KEY", secretValue);
  } else if (feature.toUpperCase().includes("SOVEREIGN")) {
    PropertiesService.getScriptProperties().setProperty("SOVEREIGN_API_KEY", secretValue);
  } else {
    PropertiesService.getScriptProperties().setProperty(feature, secretValue);
  }

  // Log to Google Sheet
  const masked = secretValue.length > 8
    ? secretValue.substring(0, 4) + "..." + secretValue.substring(secretValue.length - 4)
    : "********";
  logToSheet("Vault Audit Log", ["update_matrix", feature, "SUCCESS", `Locked into Vault (${masked})`]);

  // Dispatch key_rotation_event to GitHub repository
  let ghStatus = "Skipped (no GH_PAT)";
  try {
    const ghPat = PropertiesService.getScriptProperties().getProperty("GH_PAT");
    if (ghPat) {
      dispatchGitHubEvent("key_rotation_event", {
        secret_id: feature.toUpperCase().includes("GEMINI") ? "GOOGLE_GENAI_API_KEY" : feature,
        timestamp: new Date().toISOString()
      });
      ghStatus = "Dispatched key_rotation_event";
    }
  } catch (ghErr) {
    ghStatus = "GitHub dispatch failed: " + ghErr.message;
  }

  return respondJson({
    result: {
      status: "LOCKED_IN_VAULT",
      feature: feature,
      githubSync: ghStatus,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Handles Anti-Gravity setup verification.
 */
function handleAntiGravitySetup(data) {
  const props = PropertiesService.getScriptProperties().getProperties();
  const hasPat = !!props["GH_PAT"];
  const hasGemini = !!(props["GEMINI_API_KEY"] || props["GOOGLE_GENAI_API_KEY"]);

  logToSheet("Vault Audit Log", ["ANTIGRAVITY", data.command || "Setup Check", "SUCCESS", `PAT:${hasPat}, Gemini:${hasGemini}`]);

  return respondJson({
    result: {
      mode: "ANTIGRAVITY",
      ready: true,
      features: {
        gitHubConfigured: hasPat,
        geminiConfigured: hasGemini,
        driveSyncActive: true
      },
      message: "Anti-Gravity subsystems nominal. Ready for autonomous pairing."
    }
  });
}

/**
 * Handles Gemini CLI command execution via Google GenAI REST API.
 */
function handleCliDispatch(data) {
  const prompt = data.command || "";
  if (!prompt) {
    return respondJson({ error: "Missing command/prompt" }, 400);
  }

  const apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY") ||
                 PropertiesService.getScriptProperties().getProperty("GOOGLE_GENAI_API_KEY") ||
                 "AIzaSyBj_rO6VWUz6gwlU7UdU6_9dk17VL8Zy5Y";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
  };

  try {
    const res = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const resCode = res.getResponseCode();
    const resText = res.getContentText();

    if (resCode >= 200 && resCode < 300) {
      const parsed = JSON.parse(resText);
      const reply = parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content
        ? parsed.candidates[0].content.parts.map(p => p.text).join("\n")
        : "(No response generated)";

      logToSheet("CLI Dispatch Log", ["CLI_DISPATCH", prompt, reply]);
      return respondJson({ result: { output: reply, status: "completed" } });
    } else {
      const errMsg = `Gemini API error ${resCode}: ${resText}`;
      logToSheet("CLI Dispatch Log", ["CLI_DISPATCH", prompt, errMsg]);
      return respondJson({ error: errMsg }, resCode);
    }
  } catch (err) {
    logToSheet("CLI Dispatch Log", ["CLI_DISPATCH", prompt, "Error: " + err.message]);
    return respondJson({ error: err.message }, 500);
  }
}

/**
 * Handles Drive State Sync.
 */
function handleDriveSync(data) {
  let sheetName = "Standalone";
  let sheetUrl = "";
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) {
      sheetName = ss.getName();
      sheetUrl = ss.getUrl();
    }
  } catch (e) {
    // Not container-bound
  }

  logToSheet("Vault Audit Log", ["DRIVE_SYNC", data.command || "Sync", "SUCCESS", sheetName]);

  return respondJson({
    result: {
      status: "SYNC_COMPLETE",
      sheetName: sheetName,
      sheetUrl: sheetUrl,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Pushes a file directly to the GitHub repository.
 */
function pushToGitHub(fileContent, fileName, commitMessage) {
  const payload = {
    "message": typeof commitMessage !== 'undefined' ? commitMessage : "Automated update via Key Master",
    "content": Utilities.base64Encode(fileContent),
    "branch": "main"
  };

  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/scripts/${fileName}`;
  const githubToken = PropertiesService.getScriptProperties().getProperty("GH_PAT");
  if (!githubToken) {
    throw new Error("GH_PAT script property is not set. Configure it in Project Settings → Script Properties.");
  }

  let sha = "";
  try {
    const checkRes = UrlFetchApp.fetch(url, {
      "headers": { "Authorization": "token " + githubToken },
      "muteHttpExceptions": true
    });
    if (checkRes.getResponseCode() === 200) {
      sha = JSON.parse(checkRes.getContentText()).sha;
      payload.sha = sha;
    } else if (checkRes.getResponseCode() !== 404) {
      throw new Error(`GitHub API error (${checkRes.getResponseCode()}): ${checkRes.getContentText()}`);
    }
  } catch (e) {
    if (e.message && e.message.startsWith("GitHub API error")) throw e;
    Logger.log("⚠️ Could not fetch existing SHA: " + e.message);
  }

  const options = {
    "method": "put",
    "contentType": "application/json",
    "headers": { "Authorization": "token " + githubToken },
    "payload": JSON.stringify(payload)
  };

  const putRes = UrlFetchApp.fetch(url, options);
  if (putRes.getResponseCode() < 200 || putRes.getResponseCode() >= 300) {
    throw new Error(`GitHub push failed (${putRes.getResponseCode()}): ${putRes.getContentText()}`);
  }
  Logger.log(`✅ Pushed ${fileName} to Amazing-Grace/scripts/`);
}

/**
 * Dispatches a repository_dispatch event to GitHub.
 */
function dispatchGitHubEvent(eventType, clientPayload) {
  const githubToken = PropertiesService.getScriptProperties().getProperty("GH_PAT");
  if (!githubToken) {
    throw new Error("GH_PAT script property is not set.");
  }

  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/dispatches`;
  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": "token " + githubToken,
      "Accept": "application/vnd.github.v3+json"
    },
    payload: JSON.stringify({
      event_type: eventType,
      client_payload: clientPayload
    }),
    muteHttpExceptions: true
  };

  const res = UrlFetchApp.fetch(url, options);
  if (res.getResponseCode() < 200 || res.getResponseCode() >= 300) {
    throw new Error(`GitHub dispatch failed (${res.getResponseCode()}): ${res.getContentText()}`);
  }
}

/**
 * Appends a log row to a Google Sheet tab safely.
 */
function logToSheet(tabName, rowData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return;
    const sheet = getOrCreateSheet(ss, tabName, ["Timestamp", "Action", "Detail 1", "Detail 2"]);
    sheet.appendRow([new Date(), ...rowData]);
  } catch (err) {
    Logger.log("Sheet log failed: " + err.message);
  }
}

/**
 * Helper to get or create a Sheet tab with headers.
 */
function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    }
  }
  return sheet;
}

/**
 * Helper to return a JSON HTTP response.
 */
function respondJson(data, status = 200) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
