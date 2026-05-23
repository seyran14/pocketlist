import NextAuth from "next-auth"
import { timingSafeEqual } from "crypto"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Resend from "next-auth/providers/resend"
import Credentials from "next-auth/providers/credentials"
import { Resend as ResendClient } from "resend"
import { prisma } from "@/lib/prisma"
import { signInEmailHtml } from "@/lib/emails/signInEmail"
import type { JWT } from "next-auth/jwt"

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      id: "admin-password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const adminEmail = process.env.ADMIN_EMAIL ?? ""
        const adminPass = process.env.ADMIN_PASSWORD ?? ""
        const inputEmail = String(credentials?.email ?? "")
        const inputPass = String(credentials?.password ?? "")

        // Use timing-safe comparison to prevent timing attacks
        const emailMatch = inputEmail.length === adminEmail.length &&
          timingSafeEqual(Buffer.from(inputEmail), Buffer.from(adminEmail))
        const passMatch = inputPass.length === adminPass.length &&
          timingSafeEqual(Buffer.from(inputPass), Buffer.from(adminPass))

        if (!emailMatch || !passMatch) {
          return null
        }
        const user = await prisma.user.upsert({
          where: { email: process.env.ADMIN_EMAIL! },
          update: {},
          create: { email: process.env.ADMIN_EMAIL! },
        })
        return user
      },
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: "PocketList <noreply@rncn8n.com>",
      maxAge: 15 * 60,
      generateVerificationToken: () =>
        String(require("crypto").randomInt(100000, 1000000)),
      sendVerificationRequest: async ({ identifier: email, token }) => {
        const resend = new ResendClient(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: "PocketList <noreply@rncn8n.com>",
          to: email,
          subject: `${token} is your PocketList sign-in code`,
          html: signInEmailHtml(token),
        })
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role ?? "BUYER"
      } else if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, name: true },
        })
        if (dbUser) {
          token.role = dbUser.role
          token.name = dbUser.name
        }
      }
      return token
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any; token: JWT }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/auth/verify",
  },
})
