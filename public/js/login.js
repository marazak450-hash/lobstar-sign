/**
 * login.js
 */
document.addEventListener("DOMContentLoaded", () => {
  if (getUser()) window.location.href = "/";

  document.getElementById("login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = document.getElementById("login-error");
    errEl.style.display = "none";

    const email    = e.target.email.value.trim();
    const password = e.target.password.value;

    try {
      const { token, user } = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      saveAuth(token, user);
      window.location.href = "/";
    } catch (err) {
      errEl.textContent = err.message;
      errEl.style.display = "block";
    }
  });
});
