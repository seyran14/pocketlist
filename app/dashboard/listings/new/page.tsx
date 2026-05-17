import { Navbar } from "@/components/Navbar"
import { NewListingClient } from "./NewListingClient"

export default function NewListingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <NewListingClient />
    </div>
  )
}
