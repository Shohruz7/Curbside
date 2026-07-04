// Direct browser -> Cloudinary unsigned upload.
// The image never touches our API or database; we only store the hosted URL.
// Cloud name + preset are PUBLIC values (see .env.example), not secrets.

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Placeholder values from .env.example count as "not configured" so the
// app falls back to a plain photo-URL input instead of failing uploads.
export const isCloudinaryConfigured = Boolean(
  cloudName &&
    uploadPreset &&
    cloudName !== "your_cloud_name" &&
    uploadPreset !== "your_unsigned_preset"
);

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

export async function uploadImage(file) {
  if (!isCloudinaryConfigured) {
    throw new Error("Image uploads are not configured. Paste a photo URL instead.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (JPG, PNG, etc.).");
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image must be 10MB or smaller.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Photo upload failed. Please try again.");
  }

  return data.secure_url;
}
