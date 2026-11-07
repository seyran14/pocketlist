// Rebuilds every photo thumbnail from its full-size file. Run after changing the thumbnail
// size in lib/photos.ts: `npx tsx scripts/rebuild-thumbs.ts`.
import { prisma } from "@/lib/prisma"
import { rebuildThumbnail } from "@/lib/photos"

async function main() {
  const photos = await prisma.listingPhoto.findMany({ select: { id: true } })
  let rebuilt = 0
  for (const { id } of photos) if (await rebuildThumbnail(id)) rebuilt++
  console.log(`Rebuilt ${rebuilt} of ${photos.length} thumbnails.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
