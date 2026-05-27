import Link from "next/link"
import { RegisterForm } from "./RegisterForm"
import { HousePattern } from "@/components/HousePattern"

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center p-4">
      <HousePattern />
      <div className="card-animate w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold">
            PocketList
          </Link>
          <p className="text-muted-foreground text-sm mt-1">Create your account</p>
        </div>

        <RegisterForm />
      </div>
    </div>
  )
}
