CIPHERSAFE - IMPROVED LOCAL DEMO

Files:
- index.html: interface
- style.css: existing visual design
- script.js: Web Crypto API implementation

Run:
1. Keep all three files in the same folder.
2. Open the folder in VS Code.
3. Use Live Server (recommended) or another localhost web server.
4. On first open, create a master password of at least 12 characters and confirm it.
5. Add demo credentials, lock the vault, refresh, and unlock with the same master password.

Security design:
- PBKDF2-HMAC-SHA-512 with a random salt and 310,000 iterations derives a 256-bit AES key.
- AES-256-GCM encrypts the complete credential vault before it is stored in localStorage.
- A fresh 96-bit IV is generated for each encryption and GCM authentication detects ciphertext tampering.
- No master password or derived key is stored. The key and decrypted credentials are held in memory while unlocked.

Important limitations:
- This is an educational, browser-only prototype, not a production password manager.
- Browser localStorage can be read by anyone who gains access to the same browser profile; XSS or malicious browser extensions can compromise data while the vault is unlocked.
- There is no server-side account system, multi-factor authentication, password recovery, or independent security audit.
- SHA-512 is used as the hash primitive inside PBKDF2-HMAC-SHA-512 for key derivation. Do not describe this as a standalone SHA-512 password hash database.
- Forgetting the master password means the encrypted vault cannot be recovered.
- Test only with synthetic/demo credentials, never real passwords.
