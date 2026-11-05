import { createHash, randomBytes } from "crypto"
import { Resend } from "resend"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { contractEmailHtml } from "@/lib/emails/contractEmail"
import { EMAIL_FROM, SUPPORT_EMAIL } from "@/lib/utils"

export const CONTRACT_LINK_DAYS = 14

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex")

export function newContractToken() {
  const token = randomBytes(32).toString("base64url")
  return { token, tokenHash: hashToken(token) }
}

export function contractUrl(token: string) {
  return `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://pocketlist.ae"}/contracts/${token}`
}

export function findContractByToken(token: string) {
  return prisma.tenancyContract.findUnique({ where: { tokenHash: hashToken(token) } })
}

// A failed email doesn't undo a signature: both sides can still open the contract on the site.
export async function sendContractEmail(
  to: string,
  subject: string,
  content: Parameters<typeof contractEmailHtml>[0],
  pdf?: Buffer
) {
  try {
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: SUPPORT_EMAIL,
      subject,
      html: contractEmailHtml(content),
      attachments: pdf && [{ filename: "tenancy-contract.pdf", content: pdf }],
    })
    if (error) {
      logger.error("contract.email_failed", error)
      return false
    }
    return true
  } catch (err) {
    logger.error("contract.email_failed", err)
    return false
  }
}
