// Top-level component. Defines the routes/pages of the app.

import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import NewPost from "./pages/NewPost.jsx";
import ItemDetail from "./pages/ItemDetail.jsx";
import MyPosts from "./pages/MyPosts.jsx";
import { getToken } from "./api/client.js";

// Keeps already-logged-in users out of the login/register pages. Auth only
// changes via saveAuth/logout, and every such transition does a full page
// reload, so this synchronous token read is always fresh.
function RedirectIfAuthed({ children }) {
  return getToken() ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <div>
      <Navbar />

      {/* each route renders one page */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            <RedirectIfAuthed>
              <Login />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/register"
          element={
            <RedirectIfAuthed>
              <Register />
            </RedirectIfAuthed>
          }
        />
        <Route path="/new" element={<NewPost />} />
        <Route path="/items/:id" element={<ItemDetail />} />
        <Route path="/my-posts" element={<MyPosts />} />
      </Routes>
    </div>
  );
}
