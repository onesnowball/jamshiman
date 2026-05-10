import Link from 'next/link'
import { GraduationCap, Shield, Star, Users, ArrowRight, Calendar, MessageSquare, BookOpen } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            <GraduationCap className="w-5 h-5 text-brand-600" />
            jamshiman
          </div>
          <Link href="/auth/login" className="btn-primary text-sm">
            Sign in with UMich email
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <span className="w-1.5 h-1.5 bg-brand-500 rounded-full"></span>
          Starting at UMich, built for US campus life
        </div>

        <h1 className="text-4xl font-semibold text-gray-900 leading-tight mb-4">
          The US take on Everytime,<br />starting with grad students
        </h1>
        <p className="text-gray-500 text-lg mb-10 max-w-lg mx-auto">
          jamshiman is an Everytime-style campus product for US students.
          The alpha starts at UMich with advisor reviews, course reviews, department boards, and a private schedule builder.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
          <Link href="/advisors" className="btn-primary py-3 px-6 text-base">
            Explore the alpha <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/auth/login" className="btn-secondary py-3 px-6 text-base">
            Sign in with UMich email
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-8">
          {[
            { icon: Shield, title: 'Verified & anonymous', desc: '@umich.edu required, but your identity is never shown publicly.' },
            { icon: Star, title: 'Structured ratings', desc: 'Rate mentorship, funding, work-life balance, communication, and career support separately.' },
            { icon: Users, title: 'Everytime-style trust', desc: 'A campus space for honest student-to-student sharing, starting with advisor reviews.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-5">
              <Icon className="w-5 h-5 text-brand-600 mb-3" />
              <h3 className="font-medium text-gray-900 mb-1 text-sm">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          {[
            { href: '/courses', icon: BookOpen, title: 'Courses', desc: 'Search the seeded launch catalog and unlock public reviews after 3 submissions.' },
            { href: '/boards', icon: MessageSquare, title: 'Boards', desc: 'Department-specific threads for anonymous questions, advice, and situational context.' },
            { href: '/schedule', icon: Calendar, title: 'Schedule', desc: 'Build a private weekly plan with manual course meeting blocks.' },
          ].map(({ href, icon: Icon, title, desc }) => (
            <Link key={href} href={href} className="card p-5 hover:border-brand-200 hover:shadow-md transition-all">
              <Icon className="w-5 h-5 text-brand-600 mb-3" />
              <h3 className="font-medium text-gray-900 mb-1 text-sm">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
