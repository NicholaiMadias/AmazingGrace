/**
 * sync-property-listing.js
 *
 * Syncs the 926 E Poinsettia Ave listing to the gamifiedlearning.github.io
 * properties directory via the GitHub Contents API.
 *
 * Usage:
 *   GITHUB_TOKEN=<pat> node scripts/sync-property-listing.js
 *
 * Required environment variable:
 *   GITHUB_TOKEN — a Personal Access Token (or Actions token) with
 *                  `contents: write` permission on
 *                  NicholaiMadias/gamifiedlearning.github.io
 */

const PROPERTY_DATA = {
  id: "926-poinsettia",
  address: "926 E Poinsettia Ave, Tampa, FL 33612",
  price: 850,
  type: "All-Inclusive Professional Suite",
  targetAudience: "Medical/Doctors/Nurses",
  contact: "727-420-2873",
};

const TARGET_REPO = "NicholaiMadias/gamifiedlearning.github.io";
const FILE_PATH   = `properties/${PROPERTY_DATA.id}.json`;
const API_BASE    = "https://api.github.com";

/**
 * Return the current SHA of a file in the target repo, or undefined if the
 * file does not yet exist (first-time create).
 */
async function getFileSha(token) {
  const url = `${API_BASE}/repos/${TARGET_REPO}/contents/${FILE_PATH}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 200) {
    const data = await res.json();
    return data.sha;
  } else if (res.status === 404) {
    return undefined; // File does not exist yet — will create a new one
  }

  const text = await res.text();
  throw new Error(`Failed to get file SHA (HTTP ${res.status}): ${text}`);
}

async function syncPropertyListing() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("Error: GITHUB_TOKEN environment variable is not set.");
    process.exit(1);
  }

  const sha     = await getFileSha(token);
  const content = Buffer.from(JSON.stringify(PROPERTY_DATA, null, 2)).toString("base64");
  const url     = `${API_BASE}/repos/${TARGET_REPO}/contents/${FILE_PATH}`;

  const body = {
    message: `Sync property listing for ${PROPERTY_DATA.id}`,
    content,
    ...(sha && { sha }), // Include SHA only when updating an existing file
  };

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    console.log(`✅ Successfully synced property ${PROPERTY_DATA.id} to ${TARGET_REPO}.`);
  } else {
    const text = await res.text();
    console.error(`❌ Failed to sync property. Status: ${res.status}`);
    console.error(text);
    process.exit(1);
  }
}

syncPropertyListing();
