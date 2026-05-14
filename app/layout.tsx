import type { Metadata } from 'next'
import './globals.css'
import { CelebrationListener } from '@/components/brand/CelebrationListener'
import { CapybaraLurker } from '@/components/brand/CapybaraLurker'

export const metadata: Metadata = {
  title: 'jamshiman — Everytime for US campus life',
  description: 'An Everytime-inspired platform for US students, starting with anonymous reviews for UMich grad students.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <CelebrationListener />
        <CapybaraLurker />
      </body>
    </html>
  )
}
