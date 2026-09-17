import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { sql } from '@/lib/db'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false
      
      try {
        const db = sql()
        const rows = await db`
          SELECT id FROM admin WHERE email = ${user.email.toLowerCase().trim()} LIMIT 1
        `
        if (rows.length > 0) {
          return true
        }
        return false // Deny access if not an admin
      } catch (error) {
        console.error('Error in signIn callback:', error)
        return false
      }
    },
    async session({ session, token }) {
      return session
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  }
})

export { handler as GET, handler as POST }
