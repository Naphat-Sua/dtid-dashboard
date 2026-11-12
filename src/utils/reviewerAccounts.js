// ============================================================
// Read-only reviewer sign-in for the website demo (no backend needed).
// A matching username/password opens the LOCAL demo data with the Analyst
// role: every map, analysis and network view, but no Admin page, no CSV
// import and no editing.
//
// Only a SHA-256 of "username:password" ships in the bundle, which keeps the
// password out of plain sight. It is not access control: the demo data is
// synthetic and public, and demo-mode edits never leave the browser anyway.
// Real accounts (DB mode) are still checked by the API server.
// ============================================================

export const REVIEWER_ACCOUNTS = [
  {
    credentialHash: 'e29ddc7c2023610e7c56c241dc5074ca778197803fa2f4f0589a55a38b101c82',
    role: 'Analyst',
    fullName: 'ผู้ตรวจ (Reviewer)',
  },
];

const sha256Hex = async (text) => {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

/** The reviewer account for these credentials, or null. Username is case-insensitive. */
export async function matchReviewerAccount(username, password) {
  if (!username || !password || !globalThis.crypto?.subtle) return null;
  const hash = await sha256Hex(`${username.trim().toLowerCase()}:${password}`);
  const account = REVIEWER_ACCOUNTS.find((a) => a.credentialHash === hash);
  return account ? { username: username.trim().toLowerCase(), role: account.role, fullName: account.fullName } : null;
}
