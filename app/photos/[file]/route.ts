import { readPhotoFile } from "@/lib/photos"

export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params
  const data = await readPhotoFile(file)
  if (!data) return new Response("Not found", { status: 404 })

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/webp",
      // Ids are never reused, so the bytes behind a URL never change.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
