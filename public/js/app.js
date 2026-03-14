/**
 * app.js – Shared utilities loaded on every page.
 * Security: all DOM output uses textContent / createElement (never innerHTML with user data).
 */

const API = "/api";

// ── Auth helpers ──────────────────────────────────────────────────────────────

function getToken() {
  return sessionStorage.getItem("fw_token"); // sessionStorage clears on tab close
}

function getUser() {
  try {
    return JSON.parse(sessionStorage.getItem("fw_user") || "null");
  } catch {
    return null;
  }
}

function saveAuth(token, user) {
  sessionStorage.setItem("fw_token", token);
  sessionStorage.setItem("fw_user", JSON.stringify(user));
}

function clearAuth() {
  sessionStorage.removeItem("fw_token");
  sessionStorage.removeItem("fw_user");
}

// ── Fetch wrapper with auth header ────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// ── Cart count badge ──────────────────────────────────────────────────────────

async function updateCartCount() {
  const el = document.getElementById("cart-count");
  if (!el || !getToken()) return;
  try {
    const { items } = await apiFetch("/cart");
    el.textContent = items.reduce((s, i) => s + i.quantity, 0);
  } catch {
    // not critical
  }
}

// ── Nav auth state ────────────────────────────────────────────────────────────

function updateNavAuth() {
  const user = getUser();
  const navAuth = document.getElementById("nav-auth");
  const logoutBtn = document.getElementById("logout-btn");

  if (user && navAuth) navAuth.style.display = "none";
  if (user && logoutBtn) {
    logoutBtn.style.display = "inline-block";
    logoutBtn.addEventListener("click", () => {
      clearAuth();
      window.location.href = "/";
    });
  }
}

// ── Safe text node helper ─────────────────────────────────────────────────────

function safeText(val) {
  const el = document.createElement("span");
  el.textContent = val;
  return el.textContent; // just the escaped string – use with textContent, not innerHTML
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  updateNavAuth();
  updateCartCount();
});
