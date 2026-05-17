import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="card-animate w-full max-w-sm text-center">
        <p className="text-7xl font-bold text-muted-foreground/20">404</p>
        <h1 className="text-xl font-semibold mt-4">Page not found</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          This listing may have been removed or the link is broken.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/">
            <Button variant="default">Browse listings</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
