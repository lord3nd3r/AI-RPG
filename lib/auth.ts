/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from 'next-auth/next'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export interface AuthSession {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role: string
    banned: boolean
  }
}

const ROOT_EMAIL = process.env.ROOT_ADMIN_EMAIL

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          return null
        }

        const isRoot = ROOT_EMAIL && user.email === ROOT_EMAIL

        if (user.banned && !isRoot) {
           throw new Error('User is banned')
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          role: isRoot ? 'admin' : user.role,
          banned: isRoot ? false : user.banned
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const
  },
  callbacks: {
    async jwt({ token, user }: { token: any, user: any }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.banned = user.banned
      }
      // Force admin role if user matches ROOT_ADMIN_EMAIL
      if (process.env.ROOT_ADMIN_EMAIL && token.email === process.env.ROOT_ADMIN_EMAIL) {
        token.role = 'admin'
      }
      return token
    },
    async session({ session, token }: { session: any, token: any }) {
      if (token && session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.banned = token.banned
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
}
export const getSession = async (): Promise<AuthSession | null> => {
  const session = await getServerSession(authOptions) as any
  if (!session?.user?.id) return null
  return session as AuthSession
}
