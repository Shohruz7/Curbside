import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import ItemCard from "../components/ItemCard.jsx";
import { apiRequest, getSavedUser } from "../api/client.js";

export default function MyPosts() {
  const user = getSavedUser();

  const [itemList, setItemList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let active = true;

    async function loadItems() {
      try {
        setLoading(true);
        setError("");

        const data = await apiRequest(`/users/${user.id}/items`);

        if (active) setItemList(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        if (active) {
          setError(err.message || "Could not load your posts.");
          setItemList([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadItems();

    return () => {
      active = false;
    };
    // getSavedUser reads localStorage; user.id is the stable dependency.
  }, [user?.id]);

  if (!user) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl border bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-black">Log in to see your posts</h1>
          <p className="mt-2 text-gray-600">
            Your giveaway posts show up here once you're signed in.
          </p>
          <Link
            to="/login"
            className="mt-5 inline-block rounded-full bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
          Your giveaways
        </p>
        <h1 className="text-3xl font-black">My posts</h1>
      </div>

      {loading && (
        <div className="rounded-3xl border bg-white p-8 text-center shadow-sm">
          Loading your posts...
        </div>
      )}

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && itemList.length === 0 && (
        <div className="rounded-3xl border bg-white p-10 text-center shadow-sm">
          <h3 className="text-xl font-bold">You haven't posted anything yet</h3>
          <p className="mt-2 text-gray-600">
            Share your first curbside item so neighbors can find it.
          </p>
          <Link
            to="/new"
            className="mt-5 inline-block rounded-full bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800"
          >
            Post an item
          </Link>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {itemList.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}
