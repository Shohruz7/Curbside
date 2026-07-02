export default function ItemCard({ item }) {
  const statusStyle =
    item.status === "available"
      ? "bg-green-100 text-green-700"
      : item.status === "reserved"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-gray-100 text-gray-700";

  return (
    <div className="border rounded-lg p-3 shadow-sm bg-white">
      {item.photoUrl ? (
        <img
          src={item.photoUrl}
          alt={item.title}
          className="w-full h-40 object-cover rounded"
        />
      ) : (
        <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center text-gray-500">
          No photo
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mt-3">
        <h3 className="font-semibold">{item.title}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${statusStyle}`}>
          {item.status}
        </span>
      </div>

      {item.category && (
        <p className="text-xs uppercase tracking-wide text-gray-500 mt-1">
          {item.category}
        </p>
      )}

      <p className="text-sm mt-2 text-gray-700">
        {item.description || "No description provided."}
      </p>
    </div>
  );
}
