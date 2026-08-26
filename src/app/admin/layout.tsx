'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/admin', label: 'Áttekintés', icon: '📊' },
  { href: '/admin/foglalasok', label: 'Foglalások', icon: '📅' },
  { href: '/admin/staff', label: 'Munkatársak', icon: '👥' },
  { href: '/admin/szolgaltatasok', label: 'Szolgáltatások', icon: '✂️' },
  { href: '/admin/munkaidо-beallitas', label: 'Munkaidő', icon: '⏰' },
  { href: '/admin/ertekelesek', label: 'Értékelések', icon: '⭐' },
  { href: '/admin/beallitasok', label: 'Beállítások', icon: '⚙️' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Oldalsáv */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-indigo-600">Glamio</h1>
          <p className="text-xs text-gray-400 mt-1">Szalon admin</p>
        </div>

        {/* Navigáció */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Kijelentkezés */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <span className="text-lg">🚪</span>
            Kijelentkezés
          </button>
        </div>
      </aside>

      {/* Fő tartalom */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}