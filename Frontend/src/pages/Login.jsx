// Login page.

import { useState } from "react";

import { apiRequest } from "../api/client.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    // TODO: call POST /api/auth/login, save the returned token to localStorage,
    // then redirect to "/"
    const result = await apiRequest("/auth/login", {
      method: "POST",
      body: { email, password }
    });
    console.log(result);
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 max-w-sm flex flex-col gap-2">
      <h2 className="text-xl font-bold">Login</h2>
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Log in</button>
    </form>
  );
}
