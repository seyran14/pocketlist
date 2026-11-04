export const MAX_PHOTOS_PER_LISTING = 15
export const MAX_PHOTO_BYTES = 15 * 1024 * 1024

export function photoUrl(id: string, size: "full" | "thumb" = "full") {
  return `/photos/${id}${size === "thumb" ? "-thumb" : ""}.webp`
}
