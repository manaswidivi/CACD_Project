/* CipherSafe demo: encrypted local vault using Web Crypto API.
   PBKDF2-HMAC-SHA-512 derives an AES-256-GCM key from the master password.
   Only salt + IV + ciphertext are persisted in localStorage. */

const STORAGE_KEY = "ciphersafe.encryptedVault.v1";
const PBKDF2_ITERATIONS = 310000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const loginButton = document.getElementById("loginBtn");
const passwordInput = document.getElementById("masterPassword");
const confirmInput = document.getElementById("confirmPassword");
const confirmContainer = document.getElementById("confirmPasswordContainer");
const message = document.getElementById("message");
const showPassword = document.getElementById("showPassword");
const loginDescription = document.getElementById("loginDescription");
const loginScreen = document.querySelector(".main-content");
const loginWorkflow = document.querySelector(".workflow");
const vaultDashboard = document.getElementById("vaultDashboard");
const lockVault = document.getElementById("lockVault");
const addCredentialBtn = document.getElementById("addCredentialBtn");
const credentialForm = document.getElementById("credentialForm");
const closeForm = document.getElementById("closeForm");
const saveCredential = document.getElementById("saveCredential");
const credentialList = document.getElementById("credentialList");
const searchInput = document.getElementById("searchInput");
const websiteInput = document.getElementById("websiteInput");
const usernameInput = document.getElementById("usernameInput");
const credentialPasswordInput = document.getElementById("credentialPasswordInput");

let credentials = [];
let activeKey = null;
let isSetupMode = !localStorage.getItem(STORAGE_KEY);

function setMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? "#b42318" : "#167044";
}

function updateLoginMode() {
  isSetupMode = !localStorage.getItem(STORAGE_KEY);
  confirmContainer.style.display = isSetupMode ? "flex" : "none";
  loginButton.querySelector("span").textContent = isSetupMode ? "CREATE SECURE VAULT" : "UNLOCK VAULT";
  loginDescription.textContent = isSetupMode
    ? "Create a strong master password to initialize your encrypted vault. It cannot be recovered if forgotten."
    : "Enter your master password to decrypt and access your secure vault.";
  setMessage(isSetupMode ? "First-time setup: use at least 12 characters." : "");
}

function randomBytes(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

async function deriveEncryptionKey(password, salt, iterations = PBKDF2_ITERATIONS) {
  const material = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-512" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptVault(data, key) {
  const iv = randomBytes(12); // Fresh 96-bit nonce for every AES-GCM encryption.
  const plaintext = encoder.encode(JSON.stringify(data));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return {
    version: 1,
    kdf: "PBKDF2-HMAC-SHA-512",
    iterations: PBKDF2_ITERATIONS,
    salt: vaultMetadata.salt,
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encrypted))
  };
}

let vaultMetadata = { salt: "" };

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function decryptVault(record, key) {
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(record.iv) },
    key,
    base64ToBytes(record.ciphertext)
  );
  const parsed = JSON.parse(decoder.decode(plaintext));
  if (!Array.isArray(parsed)) throw new Error("Vault data format is invalid.");
  return parsed;
}

async function createVault(password) {
  const salt = randomBytes(16);
  vaultMetadata = { salt: bytesToBase64(salt) };
  const key = await deriveEncryptionKey(password, salt);
  const record = await encryptVault([], key);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  activeKey = key;
  credentials = [];
  openVault();
  setMessage("");
}

async function unlockVault(password) {
  const record = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (!record || record.version !== 1) throw new Error("Vault data is missing or unsupported.");
  const salt = base64ToBytes(record.salt);
  const key = await deriveEncryptionKey(password, salt, record.iterations);
  const decrypted = await decryptVault(record, key); // Wrong passwords fail authentication here.
  activeKey = key;
  vaultMetadata = { salt: record.salt };
  credentials = decrypted;
  openVault();
  setMessage("");
}

async function persistVault() {
  if (!activeKey) throw new Error("Vault is locked.");
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY));
  vaultMetadata = { salt: existing.salt };
  const encryptedRecord = await encryptVault(credentials, activeKey);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(encryptedRecord));
}

function openVault() {
  loginScreen.style.display = "none";
  loginWorkflow.style.display = "none";
  vaultDashboard.style.display = "block";
  credentialForm.style.display = "none";
  renderCredentials();
  vaultDashboard.scrollIntoView({ behavior: "smooth", block: "start" });
  passwordInput.value = "";
  confirmInput.value = "";
}

function lockCurrentVault() {
  activeKey = null;
  credentials = [];
  credentialList.innerHTML = "";
  credentialForm.style.display = "none";
  clearForm();
  searchInput.value = "";
  vaultDashboard.style.display = "none";
  loginScreen.style.display = "grid";
  loginWorkflow.style.display = "block";
  passwordInput.value = "";
  confirmInput.value = "";
  setMessage("Vault locked. Decrypted credentials cleared from the page.");
  updateLoginMode();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

loginButton.addEventListener("click", async () => {
  if (!window.crypto || !crypto.subtle) {
    setMessage("Web Crypto is unavailable. Open this site on localhost or HTTPS.", true);
    return;
  }
  const password = passwordInput.value;
  if (!password) {
    setMessage("Enter your master password.", true);
    return;
  }
  loginButton.disabled = true;
  try {
    if (isSetupMode) {
      if (password.length < 12) throw new Error("Use a master password with at least 12 characters.");
      if (password !== confirmInput.value) throw new Error("The master passwords do not match.");
      await createVault(password);
    } else {
      await unlockVault(password);
    }
  } catch (error) {
    setMessage(error.name === "OperationError" ? "Incorrect master password or damaged vault data." : error.message || "Could not open the vault.", true);
  } finally {
    loginButton.disabled = false;
    updateLoginMode();
  }
});

passwordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") loginButton.click();
});
confirmInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") loginButton.click();
});

showPassword.addEventListener("click", () => {
  passwordInput.type = passwordInput.type === "password" ? "text" : "password";
  showPassword.textContent = passwordInput.type === "password" ? "◉" : "◎";
});

addCredentialBtn.addEventListener("click", () => {
  credentialForm.style.display = "block";
  websiteInput.focus();
  credentialForm.scrollIntoView({ behavior: "smooth", block: "center" });
});

closeForm.addEventListener("click", () => {
  credentialForm.style.display = "none";
  clearForm();
});

saveCredential.addEventListener("click", async () => {
  const website = websiteInput.value.trim();
  const username = usernameInput.value.trim();
  const password = credentialPasswordInput.value;
  if (!website || !username || !password) {
    alert("Please fill in all credential fields.");
    return;
  }
  credentials.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), website, username, password });
  try {
    await persistVault();
    renderCredentials();
    credentialForm.style.display = "none";
    clearForm();
  } catch (error) {
    credentials.pop();
    alert("Could not save encrypted credentials: " + error.message);
  }
});

function renderCredentials(filteredCredentials = credentials) {
  credentialList.replaceChildren();
  if (!filteredCredentials.length) {
    const empty = document.createElement("div");
    empty.className = "empty-message";
    const title = document.createElement("strong");
    title.textContent = "YOUR VAULT IS EMPTY";
    const detail = document.createElement("p");
    detail.textContent = 'Click "+ ADD CREDENTIAL" to store your first credential.';
    empty.append(title, detail);
    credentialList.appendChild(empty);
    return;
  }

  filteredCredentials.forEach((credential, index) => {
    const card = document.createElement("div");
    card.className = "credential-card";
    const top = document.createElement("div");
    top.className = "credential-top";
    const site = document.createElement("div");
    site.className = "website-name";
    site.textContent = credential.website;
    const number = document.createElement("div");
    number.className = "credential-number";
    number.textContent = `CREDENTIAL ${String(index + 1).padStart(2, "0")}`;
    top.append(site, number);

    const info = document.createElement("div");
    info.className = "credential-info";
    const user = document.createElement("div");
    user.textContent = `USERNAME: ${credential.username}`;
    const row = document.createElement("div");
    row.className = "password-row";
    const label = document.createElement("span");
    label.textContent = "PASSWORD: ";
    const value = document.createElement("span");
    value.className = "password-value";
    value.textContent = "••••••••";
    let shown = false;
    row.append(label, value);
    info.append(user, row);

    const actions = document.createElement("div");
    actions.className = "card-actions";
    const toggle = document.createElement("button");
    toggle.textContent = "SHOW PASSWORD";
    toggle.addEventListener("click", () => {
      shown = !shown;
      value.textContent = shown ? credential.password : "••••••••";
      toggle.textContent = shown ? "HIDE PASSWORD" : "SHOW PASSWORD";
    });
    const remove = document.createElement("button");
    remove.textContent = "DELETE";
    remove.addEventListener("click", async () => {
      const old = credentials;
      credentials = credentials.filter((item) => item.id !== credential.id);
      try { await persistVault(); renderCredentials(); }
      catch (error) { credentials = old; renderCredentials(); alert("Could not update encrypted vault: " + error.message); }
    });
    actions.append(toggle, remove);
    card.append(top, info, actions);
    credentialList.appendChild(card);
  });
}

searchInput.addEventListener("input", () => {
  const term = searchInput.value.toLowerCase().trim();
  renderCredentials(credentials.filter((item) => item.website.toLowerCase().includes(term) || item.username.toLowerCase().includes(term)));
});

lockVault.addEventListener("click", lockCurrentVault);

function clearForm() {
  websiteInput.value = "";
  usernameInput.value = "";
  credentialPasswordInput.value = "";
}

// Keep the browser storage limited to encrypted vault records; the key and decrypted
// credential objects exist only in page memory while the vault is unlocked.
updateLoginMode();
