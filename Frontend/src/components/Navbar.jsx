import { Link, useNavigate } from "react-router-dom";
import { getSavedUser, logout } from "../api/client.js";

export default function Navbar() {
  const navigate = useNavigate();
  const user = getSavedUser();

  function handleLogout() {
    logout();
    navigate("/login");
    window.location.reload();
  }

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-700 text-white font-bold">
            C
          </div>
          <div>
            <p className="font-bold leading-none">Curbside</p>
            <p className="text-xs text-gray-500">NYC giveaways</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/new"
            className="rounded-full bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Post Item
          </Link>

          {user ? (
            <>
              <Link
                to="/my-posts"
                className="text-sm font-medium hover:text-green-700"
              >
                My Posts
              </Link>
              <span className="hidden text-sm text-gray-600 sm:inline">
                Hi, {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium hover:text-green-700">
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
