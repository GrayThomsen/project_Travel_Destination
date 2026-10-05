// scripts/logget-ind.js
//(() => Betyder at koden er indkapslet i en IIFE (Immediately Invoked Function Expression), som beskytter variablerne mod at blive tilgængelige globalt.
(() => {
  const loginForm = document.querySelector("#login-form");
  const loginSection = document.querySelector("#login-section");
  const travelOverview = document.querySelector("#rejseoversigt");
  const loginMessage = document.querySelector("#login-message");
  const loggedInMessage = document.querySelector("#logged-in-message");
  const logoutButton = document.querySelector("#logout-button");
  const storageKey = "loggedInUsername";

  function getStoredUsername() {
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  }

  function setStoredUsername(username) {
    try {
      localStorage.setItem(storageKey, username);
    } catch {
      // Server-sessionen er stadig den autoritative loginstatus.
    }
  }

  function removeStoredUsername() {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Server-sessionen er stadig den autoritative loginstatus.
    }
  }

  function showLoginState(username) {
    const isLoggedIn = Boolean(username);
    loginSection.hidden = isLoggedIn;
    travelOverview.hidden = !isLoggedIn;

    if (isLoggedIn) {
      loggedInMessage.textContent = `Logget ind som ${username}`;
    }
  }

  showLoginState(getStoredUsername());

  fetch("/api/session")
    .then((response) => response.json())
    .then(({ user }) => {
      if (user) {
        setStoredUsername(user.username);
      } else {
        removeStoredUsername();
      }
      showLoginState(user?.username || null);
      if (user) {
        window.dispatchEvent(new Event("bruger-logget-ind"));
      }
    })
    .catch(() => {
      removeStoredUsername();
      showLoginState(null);
    });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = loginForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    loginMessage.textContent = "Logger ind...";

    try {
      const response = await fetch(loginForm.action, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(new FormData(loginForm)),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const { user } = await response.json();
      setStoredUsername(user.username);
      loginForm.reset();
      loginMessage.textContent = "";
      showLoginState(user.username);
      window.dispatchEvent(new Event("bruger-logget-ind"));
    } catch (error) {
      loginMessage.textContent =
        error.message || "Login kunne ikke gennemføres lige nu.";
    } finally {
      submitButton.disabled = false;
    }
  });

  logoutButton.addEventListener("click", () => {
    fetch("/api/logout", { method: "POST" }).finally(() => {
      removeStoredUsername();
      showLoginState(null);
    });
  });
})();
