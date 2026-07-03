// Top-level component. Defines the routes/pages of the app.

import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import NewPost from "./pages/NewPost.jsx";
import ItemDetail from "./pages/ItemDetail.jsx";
import MyPosts from "./pages/MyPosts.jsx";

export default function App() {
  return (
    <div>
      <Navbar />

      {/* each route renders one page */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/new" element={<NewPost />} />
        <Route path="/items/:id" element={<ItemDetail />} />
        <Route path="/my-posts" element={<MyPosts />} />
      </Routes>
    </div>
  );
}
