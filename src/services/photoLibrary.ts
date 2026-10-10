/**
 * photoLibrary.ts
 * --------------------------------------------------------------------------
 * Reads the photo "database" (src/data/photos.json) and finds photos by id.
 *
 * Questions and explanations only store a short photo id like "happy-1".
 * This file turns that id into everything needed to show and credit it:
 *   uri         - the image address
 *   source      - the page the photo comes from (shown as a link)
 *   site        - where it comes from (e.g. "Pexels" or "Shutterstock")
 *   description - a short easy-English description, read out by screen readers
 */
import photoData from '../data/photos.json';

/** One photo in the database. */
export interface Photo {
  id: string;
  uri: string;
  source: string;
  site: string;
  description: string;
}

/** All photos, indexed by id for quick lookups. */
const photosById: Record<string, Photo> = {};
for (const photo of photoData.photos as Photo[]) {
  photosById[photo.id] = photo;
}

/** Returns the photo with this id, or undefined if there is no such photo. */
export function getPhoto(id: string): Photo | undefined {
  return photosById[id];
}

/** Returns every photo id (used by tests to check the data files). */
export function getAllPhotoIds(): string[] {
  return Object.keys(photosById);
}
