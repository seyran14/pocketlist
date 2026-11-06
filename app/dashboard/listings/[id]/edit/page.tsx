import { Navbar } from "@/components/Navbar"
import { EditListingClient } from "./EditListingClient"

export default function EditListingPage() {
  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <EditListingClient />
    </div>
  )
}
