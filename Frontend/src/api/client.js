// Tiny helper for talking to the API.
// Keeps the fetch boilerplate in one place so the pages stay short.

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// grabs the saved JWT (set this at login time)
function getToken() {
  return localStorage.getItem("token");
}

// generic request -> path like "/items", options like { method, body }
export async function apiRequest(path, options = {}) {
  const token = getToken();

  const response = await fetch(baseUrl + path, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      // attach the token if we have one
      ...(token ? { Authorization: "Bearer " + token } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  // TODO: handle 401 by clearing the token and sending the user to /login
  return response.json();
}
