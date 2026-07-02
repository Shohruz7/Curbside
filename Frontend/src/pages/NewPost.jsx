import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORIES } from "@curbside/shared";

import { apiRequest, getToken } from "../api/client.js";

const defaultLocation = {
  lat: 40.7128,
  lng: -74.006,
};

export default function NewPost() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [lat, setLat] = useState(defaultLocation.lat);
  const [lng, setLng] = useState(defaultLocation.lng);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setError("");
      },
      () => {
        setError("Could not get your location. Using NYC default location.");
      }
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!getToken()) {
      setError("You must be logged in to post an item.");
      return;
    }

    try {
      await apiRequest("/items", {
        method: "POST",
        body: {
          title,
          description,
          category,
          photoUrl,
          lat: Number(lat),
          lng: Number(lng)
        }
      });

      setSuccess("Item posted successfully!");
      setTimeout(() => navigate("/"), 900);
    } catch (err) {
      setError(err.message);
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
          Add a title, category, location, and optional photo URL so nearby users
          can find your giveaway.
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

            <input
              className="w-full rounded-2xl border px-4 py-3"
              placeholder="Photo URL"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
            />
          </div>
        </section>

        <aside className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Pickup location</h2>
          <p className="mt-1 text-sm text-gray-600">
            Use your location or manually enter NYC coordinates.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <input
              className="rounded-2xl border px-4 py-3"
              placeholder="Latitude"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />

            <input
              className="rounded-2xl border px-4 py-3"
              placeholder="Longitude"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={useMyLocation}
            className="mt-4 w-full rounded-full border px-5 py-3 font-semibold hover:bg-gray-50"
          >
            Use my location
          </button>

          <button
            type="submit"
            className="mt-3 w-full rounded-full bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
          >
            Publish item
          </button>
        </aside>
      </form>
    </main>
  );
}
