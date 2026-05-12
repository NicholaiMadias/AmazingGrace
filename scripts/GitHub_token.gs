function pushToGitHub(fileContent, fileName, commitMessage) {
  const payload = {
    "message": typeof commitMessage !== 'undefined' ? commitMessage : "Automated update via Key Master",
    "content": Utilities.base64Encode(fileContent),
    "branch": "main"
  };

  const repoOwner = "NicholaiMadias";
  const repoName = "Amazing-Grace";
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/scripts/${fileName}`;
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
    /* Network or parse error — proceed as new file */
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
