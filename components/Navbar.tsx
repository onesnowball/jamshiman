import { getOptionalViewer } from '@/lib/server-auth'
import { NavbarClient } from './NavbarClient'

export async function Navbar({ school }: { school?: string } = {}) {
  const viewer = await getOptionalViewer()
  return <NavbarClient isAdmin={viewer?.role === 'admin'} school={school} />
}
