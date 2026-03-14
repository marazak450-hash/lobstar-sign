/**
 * register.js
 */
document.addEventListener("DOMContentLoaded", () => {
  if (getUser()) window.location.href = "/";

  document.getElementById("register-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = document.getElementById("register-error");
    errEl.style.display = "none";

    const name     = e.target.name.value.trim();
    const email    = e.target.email.value.trim();
    const password = e.target.password.value;
    const confirm  = e.target.confirm.value;

    if (password !== confirm) {
      errEl.textContent = "Passwords do not match.";
      errEl.style.display = "block";
      return;
    }

    try {
      const { token, user } = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      saveAuth(token, user);
      window.location.href = "/";
    } catch (err) {
      errEl.textContent = err.message;
      errEl.style.display = "block";
    }
  });
});
