import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Authblock - Blockchain Certificate Verification',
  description: 'Secure, tamper-proof academic credential verification powered by blockchain technology. Verify certificates instantly.',
  keywords: ['blockchain', 'certificate verification', 'academic credentials', 'ethereum', 'education', 'FRCRCE'],
  authors: [{ name: 'Authblock Team' }],
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Authblock - Blockchain Certificate Verification',
    description: 'Secure, tamper-proof academic credential verification powered by blockchain technology.',
    type: 'website',
    images: ['/logo.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans min-h-screen bg-white antialiased`}>
        {children}
      </body>
    </html>
  )
}
