// Reads a HEIC from stdin and writes a PNG, at most argv[2] px per side, to stdout. Runs as its
// own process because the WASM decoder never shrinks its heap, so its memory (about
// 650 MB for a 48 MP photo) is only given back when the process exits.
import decode from "heic-decode"
import sharp from "sharp"

const maxSide = Number(process.argv[2])

async function main() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)

  const { width, height, data } = await decode({ buffer: Buffer.concat(chunks) })
  const png = await sharp(Buffer.from(data.buffer), { raw: { width, height, channels: 4 } })
    .resize(maxSide, maxSide, { fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 1 })
    .toBuffer()
  process.stdout.write(png)
}

main().catch((err) => {
  console.error("heic-to-png:", err.message)
  process.exitCode = 1
})
