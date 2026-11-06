import { redirect } from "next/navigation"
import { isAdminSession } from "@/lib/admin"
import { Navbar } from "@/components/Navbar"
import { EditListingClient } from "@/app/dashboard/listings/[id]/edit/EditListingClient"

export default async function AdminEditListingPage() {
  if (!(await isAdminSession())) redirect("/admin")

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <EditListingClient admin />
    </div>
  )
}
