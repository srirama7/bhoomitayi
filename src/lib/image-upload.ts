import imageCompression from "browser-image-compression";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase/config";
import { MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES, MAX_IMAGES } from "@/lib/constants";

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: "image/webp" as const,
    initialQuality: 0.8,
  };
  return imageCompression(file, options);
}

export function validateImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Only JPG, PNG, and WebP images are allowed";
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return "Image must be less than 5 MB";
  }
  return null;
}

export function validateImageCount(currentCount: number, newCount: number): string | null {
  if (currentCount + newCount > MAX_IMAGES) {
    return `Maximum ${MAX_IMAGES} images allowed. You can add ${MAX_IMAGES - currentCount} more.`;
  }
  return null;
}

export async function uploadImages(
  files: File[],
  userId: string,
  listingId: string
): Promise<string[]> {
  const urls: string[] = [];

  for (const file of files) {
    const compressed = await compressImage(file);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
    const filePath = `listings/${userId}/${listingId}/${fileName}`;

    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, compressed, {
      contentType: "image/webp",
    });

    const url = await getDownloadURL(storageRef);
    urls.push(url);
  }

  return urls;
}

export async function deleteImage(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch {
    // Silently handle - image may already be deleted
  }
}
