import Link from "next/link"
import { RegisterForm } from "./RegisterForm"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
