import { Navbar } from "@/components/Navbar"
import { EditListingClient } from "./EditListingClient"

export default function EditListingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <EditListingClient />
    </div>
  )
}
