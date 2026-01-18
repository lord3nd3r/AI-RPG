import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string
      role: string
      banned: boolean
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    banned: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    banned: boolean
  }
}