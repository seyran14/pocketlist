import { getT } from "@/lib/i18n/server"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Navbar } from "@/components/Navbar"
import { ProfileForm } from "@/components/profile/ProfileForm"
import { Separator } from "@/components/ui/separator"
import { pageMetadata } from "@/lib/i18n/meta"

export function generateMetadata() {
  return pageMetadata("Profile")
}

export default async function ProfilePage() {
  const t = await getT()
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      whatsapp: true,
      telegram: true,
      contactPref: true,
    },
  })

  if (!user) redirect("/login")

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t("Profile")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {user.role === "AGENT"
              ? t("Your contact details are shown to buyers on your listings.")
              : t("Manage your account details.")}
          </p>
        </div>
        <Separator className="mb-6" />
        <div className="card-animate" style={{ animationDelay: "60ms" }}>
          <ProfileForm user={user} />
        </div>
      </main>
    </div>
  )
}
