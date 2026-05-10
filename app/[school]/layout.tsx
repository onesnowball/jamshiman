import { notFound } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { getUniversityBySlug } from '@/lib/school'

export default async function SchoolLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { school: string }
}) {
  const university = await getUniversityBySlug(params.school)
  if (!university) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar school={params.school} />
      {children}
    </div>
  )
}
