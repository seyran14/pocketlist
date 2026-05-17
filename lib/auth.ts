import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Resend from "next-auth/providers/resend"
import { Resend as ResendClient } from "resend"
import { prisma } from "@/lib/prisma"
import { signInEmailHtml } from "@/lib/emails/signInEmail"

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: "PocketList <noreply@rncn8n.com>",
      maxAge: 15 * 60,
      generateVerificationToken: () =>
        String(Math.floor(100000 + Math.random() * 900000)),
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
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        session.user.role = user.role
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
