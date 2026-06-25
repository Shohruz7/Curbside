// Form for posting a new giveaway item.

import { useState } from "react";

import { apiRequest } from "../api/client.js";

export default function NewPost() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  // const [photoFile, setPhotoFile] = useState(null); // TODO: file input for Cloudinary

  async function handleSubmit(event) {
    event.preventDefault();

    // TODO: upload the photo to Cloudinary first, get back photoUrl
    // TODO: get the location (map click or geolocation) as [lng, lat]
    const newItem = {
      title,
      description,
      category
      // photoUrl, location -> add these once the TODOs above are done
    };

    const result = await apiRequest("/items", { method: "POST", body: newItem });
    console.log(result);
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 max-w-sm flex flex-col gap-2">
      <h2 className="text-xl font-bold">Post an item</h2>
      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />
      {/* TODO: <input type="file" ... /> for the photo */}
      <button type="submit">Post</button>
    </form>
  );
}
