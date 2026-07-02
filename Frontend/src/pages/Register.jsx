import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiRequest, saveAuth } from "../api/client.js";

export default function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const result = await apiRequest("/auth/register", {
        method: "POST",
        body: { username, email, password }
      });

      saveAuth(result.token, result.user);
      navigate("/");
      window.location.reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center px-4 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black">Create account</h1>
        <p className="mt-2 text-gray-600">Join Curbside and start sharing locally.</p>

        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="mt-6 space-y-4">
          <input
            className="w-full rounded-2xl border px-4 py-3"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="w-full rounded-2xl border px-4 py-3"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full rounded-2xl border px-4 py-3"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="w-full rounded-full bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800">
            Sign up
          </button>
        </div>

        <p className="mt-5 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-green-700">
            Login
          </Link>
        </p>
      </form>
    </main>
  );
}
