import { z } from "zod"

// The form is printed with a Latin font, and DLD contracts use Latin names here too.
const latin = (max: number) =>
  z.string().trim().max(max).regex(/^[\x20-\x7E]*$/, "Use English letters and numbers only.")
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
    cheques: z.number().int().min(1).max(12),
    additionalTerms: latin(90),
    tenantEmail: z.string().trim().email().max(80),
    tenantName: latin(70),
    signature,
  })
  .refine((v) => v.ownerEmiratesId || v.ownerPassport, {
    path: ["ownerPassport"],
    message: "Add your passport or Emirates ID number.",
  })
  .refine((v) => v.endDate > v.startDate, { path: ["endDate"], message: "Must be after the start date." })

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

export type OwnerContract = z.infer<typeof ownerContractSchema>
export type TenantContract = z.infer<typeof tenantContractSchema>
