const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export function getToken() {
  return localStorage.getItem("token");
}

export function getSavedUser() {
  const saved = localStorage.getItem("user");
  return saved ? JSON.parse(saved) : null;
}

export function saveAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export async function apiRequest(path, options = {}) {
  const token = getToken();

  const response = await fetch(baseUrl + path, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json();

  if (!response.ok) {
    // An expired/invalid token means a request we *sent* with a token was
    // rejected. Clear the stale credentials and send the user to login.
    // The `token` guard keeps wrong-password logins (sent without a token)
    // from triggering a redirect loop — they just surface the error message.
    if (response.status === 401 && token) {
      logout();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    throw new Error(data.error || "Something went wrong");
  }

  return data;
}
