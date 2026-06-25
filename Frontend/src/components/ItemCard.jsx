// One giveaway item shown in the feed.
// Takes an `item` object as a prop.

export default function ItemCard({ item }) {
  return (
    <div className="border rounded p-3">
      {/* item.photoUrl comes from Cloudinary */}
      {item.photoUrl && (
        <img src={item.photoUrl} alt={item.title} className="w-full h-40 object-cover" />
      )}

      <h3 className="font-semibold mt-2">{item.title}</h3>
      <p className="text-sm">{item.description}</p>

      {/* TODO: status badge (available / reserved / claimed) */}
      {/* TODO: Reserve button -> calls POST /api/items/:id/reserve */}
    </div>
  );
}
