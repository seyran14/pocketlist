import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export const EVENT_TYPES = ["contact_revealed", "inquiry_sent", "support_message_sent"] as const
export type EventType = (typeof EVENT_TYPES)[number]

// Page views go to Umami; these three actions are counted in our own database.
// A failed write never breaks the request that triggered it.
export async function recordEvent(type: EventType, listingId?: string) {
  try {
    await prisma.analyticsEvent.create({ data: { type, listingId: listingId ?? null } })
  } catch (err) {
    logger.error("event.record_failed", err, { type })
  }
}
