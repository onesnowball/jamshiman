import Link from 'next/link'
import { GraduationCap, ArrowRight, MessageSquare, BookOpen, Star, Lock } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            <GraduationCap className="w-5 h-5 text-brand-600" />
            jamshiman
          </div>
          <Link href="/auth/login" className="btn-primary text-sm">
            Sign in with UMich email
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6">
        {/* Hero */}
        <div className="py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-700 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <Lock className="w-3.5 h-3.5" />
            UMich students only — verified by .edu email
          </div>

          <h1 className="text-5xl font-semibold text-gray-900 leading-tight tracking-tight mb-5">
            The campus community<br />built for grad students
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Honest advisor reviews, real course feedback, and anonymous department boards —
            all verified through your UMich email.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/login" className="btn-primary py-3 px-8 text-base">
              Get started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/boards" className="btn-secondary py-3 px-8 text-base">
              Browse community
            </Link>
          </div>
        </div>

        {/* Access notice */}
        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-8 mb-16 text-center">
          <p className="text-sm font-medium text-gray-900 mb-1">Who can join?</p>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Anyone with an active <strong>@umich.edu</strong> email address.
            No passwords — we verify you once with a sign-in code sent to your school inbox.
            Your email is never visible to other users.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-20">
          {[
            {
              href: '/boards',
              icon: MessageSquare,
              label: 'Community boards',
              desc: 'Anonymous threads by department. Ask the questions people usually text a friend about.',
            },
            {
              href: '/advisors',
              icon: Star,
              label: 'Advisor reviews',
              desc: 'Structured, anonymous reviews from lab members, committee students, and collaborators.',
            },
            {
              href: '/courses',
              icon: BookOpen,
              label: 'Course reviews',
              desc: 'Real workload, instruction quality, and usefulness ratings from students who took the class.',
            },
          ].map(({ href, icon: Icon, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-2xl border border-gray-100 bg-white p-6 hover:border-brand-200 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-4 group-hover:bg-brand-100 transition-colors">
                <Icon className="w-5 h-5 text-brand-600" />
              </div>
              <p className="font-medium text-gray-900 mb-1">{label}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        UMich grad students only · No passwords · Your email stays private
      </footer>
    </div>
  )
}
