import { Navbar } from "@/components/Navbar"
import { EditListingClient } from "./EditListingClient"
import { pageMetadata } from "@/lib/i18n/meta"

export function generateMetadata() {
  return pageMetadata("Edit listing")
}

export default function EditListingPage() {
  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <EditListingClient />
    </div>
  )
}
