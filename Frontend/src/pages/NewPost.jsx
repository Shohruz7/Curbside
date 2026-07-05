import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORIES } from "@curbside/shared";

import { apiRequest, getToken } from "../api/client.js";
import { uploadImage, isCloudinaryConfigured } from "../api/cloudinary.js";

export default function NewPost() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [address, setAddress] = useState("");

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handlePhotoChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    setError("");
    setUploading(true);

    try {
      const url = await uploadImage(file);
      setPhotoUrl(url);
    } catch (err) {
      setError(err.message);
      event.target.value = ""; // let the user pick the same file again
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!getToken()) {
      setError("You must be logged in to post an item.");
      return;
    }

    setSubmitting(true);
    try {
      // The server geocodes the address (adds ~1s). Any geocoding failure
      // ("Could not find that address", NYC only) surfaces here as err.message.
      await apiRequest("/items", {
        method: "POST",
        body: { title, description, category, photoUrl, address }
      });

      setSuccess("Item posted successfully!");
      setTimeout(() => navigate("/"), 900);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
          Share with your neighborhood
        </p>
        <h1 className="text-4xl font-black">Post a curbside item</h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          Add a title, category, pickup address, and an optional photo so nearby
          users can find your giveaway.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {success && <p className="mb-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">{success}</p>}

          <div className="space-y-4">
            <input
              className="w-full rounded-2xl border px-4 py-3"
              placeholder="Item title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              className="min-h-32 w-full rounded-2xl border px-4 py-3"
              placeholder="Describe the item and pickup notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <select
              className="w-full rounded-2xl border px-4 py-3 capitalize"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {isCloudinaryConfigured ? (
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="w-full rounded-2xl border px-4 py-3 file:mr-4 file:rounded-full file:border-0 file:bg-green-50 file:px-4 file:py-2 file:font-semibold file:text-green-700"
                />
                {uploading && (
                  <p className="mt-2 text-sm text-gray-600">Uploading photo…</p>
                )}
                {photoUrl && !uploading && (
                  <img
                    src={photoUrl}
                    alt="Preview of your item"
                    className="mt-3 h-40 w-full rounded-2xl object-cover"
                  />
                )}
              </div>
            ) : (
              // Fallback when Cloudinary env vars are not set, so the app
              // still works on machines without upload credentials.
              <input
                className="w-full rounded-2xl border px-4 py-3"
                placeholder="Photo URL"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
              />
            )}
          </div>
        </section>

        <aside className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Pickup location</h2>
          <p className="mt-1 text-sm text-gray-600">
            Enter the pickup street address. It stays private — nearby users only
            see the neighborhood until they reserve. Posting is limited to NYC.
          </p>

          <input
            className="mt-5 w-full rounded-2xl border px-4 py-3"
            placeholder="123 Main St, Brooklyn, NY"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <button
            type="submit"
            disabled={submitting || uploading}
            className="mt-6 w-full rounded-full bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Publishing…" : "Publish item"}
          </button>
        </aside>
      </form>
    </main>
  );
}
