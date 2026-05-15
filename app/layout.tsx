import type { Metadata } from 'next'
import './globals.css'
import { CelebrationListener } from '@/components/brand/CelebrationListener'
import { CapybaraLurker } from '@/components/brand/CapybaraLurker'
import { MascotErrorBoundary } from '@/components/brand/MascotErrorBoundary'

export const metadata: Metadata = {
  title: 'jamshiman — Everytime for US campus life',
  description: 'An Everytime-inspired platform for US students, starting with anonymous reviews for UMich grad students.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <MascotErrorBoundary>
          <CelebrationListener />
        </MascotErrorBoundary>
        <MascotErrorBoundary>
          <CapybaraLurker />
        </MascotErrorBoundary>
      </body>
    </html>
  )
}
