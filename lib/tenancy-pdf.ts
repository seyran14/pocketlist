import { readFile } from "fs/promises"
import { join } from "path"
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"
import { PAYMENT_METHODS, type OwnerContract, type TenantContract } from "@/lib/tenancy-shared"

const TEMPLATE = join(process.cwd(), "templates", "tenancy-contract.pdf")
const TEXT_SIZE = 10
const MIN_TEXT_SIZE = 6
const INK = rgb(0, 0, 0)
const NUMBER_WORDS = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE"]
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]

// Baselines on the blank form, measured from the bottom left of the page. `width`
// stops before the label on the right, and longer values shrink to fit.
const FIELDS = {
  date: { page: 0, x: 45, y: 773, width: 70 },
  ownerName: { page: 0, x: 93, y: 718, width: 370 },
  lessorName: { page: 0, x: 93, y: 700, width: 370 },
  lessorEmiratesId: { page: 0, x: 100, y: 675, width: 340 },
  lessorEmail: { page: 0, x: 100, y: 624, width: 340 },
  lessorPhone: { page: 0, x: 103, y: 604, width: 340 },
  tenantName: { page: 0, x: 101, y: 552, width: 360 },
  tenantEmiratesId: { page: 0, x: 102, y: 532, width: 340 },
  tenantEmail: { page: 0, x: 107, y: 486, width: 340 },
  tenantPhone: { page: 0, x: 114, y: 466, width: 330 },
  plotNumber: { page: 0, x: 105, y: 399, width: 140 },
  makaniNumber: { page: 0, x: 389, y: 397, width: 120 },
  buildingName: { page: 0, x: 107, y: 374, width: 180 },
  propertyNumber: { page: 0, x: 389, y: 371, width: 120 },
  propertyType: { page: 0, x: 97, y: 349, width: 170 },
  areaSqm: { page: 0, x: 392, y: 349, width: 100 },
  location: { page: 0, x: 64, y: 327, width: 220 },
  dewaNumber: { page: 0, x: 392, y: 325, width: 110 },
  startDate: { page: 0, x: 89, y: 276, width: 76 },
  endDate: { page: 0, x: 172, y: 275, width: 76 },
  contractValue: { page: 0, x: 403, y: 274, width: 110 },
  annualRent: { page: 0, x: 91, y: 247, width: 150 },
  deposit: { page: 0, x: 416, y: 248, width: 110 },
  paymentMode: { page: 0, x: 139, y: 226, width: 300 },
}

const ADDITIONAL_TERM_LINES = [274, 251.5, 229, 206.5, 184].map((y) => ({ page: 1, x: 49, y, width: 490 }))

const SIGNATURE_BOXES = {
  tenant: [
    { page: 0, x: 40, y: 28, width: 210, height: 42, dateX: 184, dateY: 15 },
    { page: 1, x: 40, y: 64, width: 210, height: 42, dateX: 182, dateY: 52 },
  ],
  lessor: [
    { page: 0, x: 340, y: 28, width: 210, height: 42, dateX: 487, dateY: 15 },
    { page: 1, x: 340, y: 64, width: 210, height: 42, dateX: 487, dateY: 52 },
  ],
}

type Spot = { page: number; x: number; y: number; width: number }

function drawAt(pages: PDFPage[], font: PDFFont, { page, x, y, width }: Spot, value: string) {
  let size = TEXT_SIZE
  while (size > MIN_TEXT_SIZE && font.widthOfTextAtSize(value, size) > width) size -= 0.25
  pages[page].drawText(value, { x, y, size, font, color: INK })
}

function draw(pages: PDFPage[], font: PDFFont, field: keyof typeof FIELDS, value: string) {
  drawAt(pages, font, FIELDS[field], value)
}

export function contractDate(iso: string) {
  const [year, month, day] = iso.split("-")
  return `${MONTHS[Number(month) - 1]}. ${day}, ${year}`
}

function shortDate(date: Date) {
  const [year, month, day] = date.toISOString().slice(0, 10).split("-")
  return `${day}/${month}/${year.slice(2)}`
}

function money(amount: number) {
  return `AED ${Math.round(amount).toLocaleString("en-US")}`
}

function paymentMode({ paymentMethod, cheques }: OwnerContract) {
  if (paymentMethod === "CHEQUES" && cheques) {
    return `${cheques} (${NUMBER_WORDS[cheques]}) CHEQUE${cheques > 1 ? "S" : ""}`
  }
  return PAYMENT_METHODS[paymentMethod].toUpperCase()
}

// Without an Emirates ID the passport goes on the name line, as DLD contracts do it.
function nameLine(name: string, emiratesId: string, passport: string) {
  return emiratesId ? name : `${name} PASSPORT NO. ${passport}`
}

async function sign(pdf: PDFDocument, pages: PDFPage[], font: PDFFont, party: "tenant" | "lessor", dataUrl: string, signedAt: Date) {
  const image = await pdf.embedPng(Buffer.from(dataUrl.split(",")[1], "base64"))
  for (const box of SIGNATURE_BOXES[party]) {
    const { width, height } = image.scaleToFit(box.width, box.height)
    pages[box.page].drawImage(image, { x: box.x + (box.width - width) / 2, y: box.y, width, height })
    pages[box.page].drawText(shortDate(signedAt), { x: box.dateX, y: box.dateY, size: 8, font, color: INK })
  }
}

export async function createContractPdf(contract: OwnerContract, reference: string, createdAt: Date) {
  const pdf = await PDFDocument.load(await readFile(TEMPLATE))
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const pages = pdf.getPages()
  const put = (field: keyof typeof FIELDS, value: string) => {
    if (value) draw(pages, font, field, value)
  }

  const name = nameLine(contract.ownerName, contract.ownerEmiratesId, contract.ownerPassport)
  put("date", contractDate(createdAt.toISOString().slice(0, 10)))
  put("ownerName", name)
  put("lessorName", name)
  put("lessorEmiratesId", contract.ownerEmiratesId)
  put("lessorEmail", contract.ownerEmail)
  put("lessorPhone", contract.ownerPhone)
  put("tenantEmail", contract.tenantEmail)
  put("plotNumber", contract.plotNumber)
  put("makaniNumber", contract.makaniNumber)
  put("buildingName", contract.buildingName)
  put("propertyNumber", contract.propertyNumber)
  put("propertyType", contract.propertyType)
  put("areaSqm", contract.areaSqm)
  put("location", contract.location)
  put("dewaNumber", contract.dewaNumber)
  put("startDate", contractDate(contract.startDate))
  put("endDate", contractDate(contract.endDate))
  put("contractValue", money(contract.contractValue))
  put("annualRent", money(contract.annualRent))
  put("deposit", money(contract.deposit))
  put("paymentMode", paymentMode(contract))
  contract.additionalTerms
    .filter((term) => term.trim())
    .forEach((term, i) => drawAt(pages, font, ADDITIONAL_TERM_LINES[i], term))

  for (const page of pages) {
    page.drawText(`Prepared on PocketList, ref. ${reference}. Takes effect once registered on Ejari.`, {
      x: 200, y: 4, size: 5, font, color: rgb(0.45, 0.45, 0.45),
    })
  }
  return pdf.save()
}

export async function addTenantToPdf(contract: Buffer, tenant: TenantContract, signedAt: Date) {
  const pdf = await PDFDocument.load(contract)
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const pages = pdf.getPages()

  draw(pages, font, "tenantName", nameLine(tenant.tenantName, tenant.tenantEmiratesId, tenant.tenantPassport))
  if (tenant.tenantEmiratesId) draw(pages, font, "tenantEmiratesId", tenant.tenantEmiratesId)
  draw(pages, font, "tenantPhone", tenant.tenantPhone)
  await sign(pdf, pages, font, "tenant", tenant.signature, signedAt)
  return pdf.save()
}

export async function addOwnerSignature(tenantSigned: Buffer, signature: string, signedAt: Date) {
  const pdf = await PDFDocument.load(tenantSigned)
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  await sign(pdf, pdf.getPages(), font, "lessor", signature, signedAt)
  return pdf.save()
}
