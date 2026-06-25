// Register page. Pretty much the same shape as Login but with a username.

import { useState } from "react";

import { apiRequest } from "../api/client.js";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    // TODO: call POST /api/auth/register, then send the user to /login (or auto-login)
    const result = await apiRequest("/auth/register", {
      method: "POST",
      body: { username, email, password }
    });
    console.log(result);
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 max-w-sm flex flex-col gap-2">
      <h2 className="text-xl font-bold">Register</h2>
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
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
      <button type="submit">Sign up</button>
    </form>
  );
}
