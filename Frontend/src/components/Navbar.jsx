// Simple top navigation bar.

import { Link } from "react-router-dom";

export default function Navbar() {
  // TODO: show "Logout" instead of Login/Register when a user is signed in
  return (
    <nav className="flex gap-4 p-4 border-b">
      <Link to="/" className="font-bold">Curbside</Link>
      <Link to="/new">Post an item</Link>
      <Link to="/login">Login</Link>
      <Link to="/register">Register</Link>
    </nav>
  );
}
