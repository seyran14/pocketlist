import { z } from "zod"

export const MAX_ADDITIONAL_TERMS = 5

export const PAYMENT_METHODS = {
  CHEQUES: "Cheques",
  BANK_TRANSFER: "Bank transfer",
  CASH: "Cash",
  CARD: "Credit or debit card",
  DIRECT_DEBIT: "Direct debit",
} as const
export type PaymentMethod = keyof typeof PAYMENT_METHODS

// The form is printed with a Latin font, and DLD contracts use Latin names here too.
export const LATIN_TEXT = /^[\x20-\x7E]*$/
const latin = (max: number) => z.string().trim().max(max).regex(LATIN_TEXT, "Use English letters and numbers only.")
const required = (max: number) => latin(max).min(1, "Required.")
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date.")
const signature = z.string().startsWith("data:image/png;base64,").max(700_000)

export const ownerContractSchema = z
  .object({
    listingId: z.string().min(1),
    ownerName: required(70),
    ownerEmiratesId: latin(30),
    ownerPassport: latin(30),
    ownerEmail: required(80),
    ownerPhone: required(30),
    plotNumber: latin(30),
    makaniNumber: latin(30),
    buildingName: required(60),
    propertyNumber: required(30),
    propertyType: required(30),
    areaSqm: latin(15),
    location: required(60),
    dewaNumber: latin(30),
    startDate: date,
    endDate: date,
    annualRent: z.number().positive(),
    contractValue: z.number().positive(),
    deposit: z.number().min(0),
    paymentMethod: z.enum(Object.keys(PAYMENT_METHODS) as [PaymentMethod, ...PaymentMethod[]]),
    cheques: z.number().int().min(1).max(12).nullable(),
    additionalTerms: z.array(latin(120)).max(MAX_ADDITIONAL_TERMS),
    tenantEmail: z.string().trim().email().max(80),
    tenantName: latin(70),
  })
  .refine((v) => v.ownerEmiratesId || v.ownerPassport, {
    path: ["ownerPassport"],
    message: "Add your passport or Emirates ID number.",
  })
  .refine((v) => v.endDate > v.startDate, { path: ["endDate"], message: "Must be after the start date." })
  .refine((v) => v.paymentMethod !== "CHEQUES" || v.cheques, { path: ["cheques"], message: "Add the number of cheques." })

export const tenantContractSchema = z
  .object({
    tenantName: required(70),
    tenantEmiratesId: latin(30),
    tenantPassport: latin(30),
    tenantPhone: required(30),
    signature,
  })
  .refine((v) => v.tenantEmiratesId || v.tenantPassport, {
    path: ["tenantPassport"],
    message: "Add your passport or Emirates ID number.",
  })

export const ownerSignatureSchema = z.object({ signature })

export type OwnerContract = z.infer<typeof ownerContractSchema>
export type TenantContract = z.infer<typeof tenantContractSchema>
