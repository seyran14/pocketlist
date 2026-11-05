// Reads a PDF or DOCX from stdin and writes its text to stdout, one visual line per
// line. Uploaded files are untrusted, so parsing stays out of the web process.
import mammoth from "mammoth"
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs"

const SAME_LINE_PT = 3

async function readPdf(data) {
  const pdf = await getDocument({ data: new Uint8Array(data), useSystemFonts: false, verbosity: 0 }).promise
  const lines = []
  for (let n = 1; n <= Math.min(pdf.numPages, 10); n++) {
    const page = await pdf.getPage(n)
    const { items } = await page.getTextContent()
    const placed = items
      .filter((item) => item.str?.trim())
      .map((item) => ({ text: item.str, x: item.transform[4], y: item.transform[5] }))
      .sort((a, b) => b.y - a.y || a.x - b.x)

    let row = []
    for (const item of placed) {
      if (row.length && Math.abs(row[0].y - item.y) > SAME_LINE_PT) {
        lines.push(row)
        row = []
      }
      row.push(item)
    }
    if (row.length) lines.push(row)
  }
  return lines.map((row) => row.sort((a, b) => a.x - b.x).map((i) => i.text.trim()).join("  ")).join("\n")
}

async function main() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  const input = Buffer.concat(chunks)

  const text = process.argv[2] === "pdf" ? await readPdf(input) : (await mammoth.extractRawText({ buffer: input })).value
  process.stdout.write(text)
}

main().catch((err) => {
  console.error("read-document:", err.message)
  process.exitCode = 1
})
