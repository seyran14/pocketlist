"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function unsaveListingAction(savedId: string) {
  const session = await auth()
  if (!session?.user) return
  await prisma.savedListing.deleteMany({
    where: { id: savedId, userId: session.user.id },
  })
  revalidatePath("/dashboard/saved")
}
