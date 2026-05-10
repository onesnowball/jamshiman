import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'jamshiman — Everytime for US campus life',
  description: 'An Everytime-inspired platform for US students, starting with anonymous reviews for UMich grad students.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
