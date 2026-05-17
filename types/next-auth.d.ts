import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "GUEST" | "BUYER" | "AGENT"
    } & DefaultSession["user"]
  }

  interface User {
    role: "GUEST" | "BUYER" | "AGENT"
  }
}
