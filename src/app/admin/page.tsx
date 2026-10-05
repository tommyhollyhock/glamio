'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Stats = {
  todayCount: number
  clientCount: number
  monthlyRevenue: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()

      const { data: profile } = await supabase
        .from('profiles')
        .select('salon_id')
        .single()

      if (!profile?.salon_id) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('bookings')
        .select('guest_email, starts_at, status, total_price')
        .eq('salon_id', profile.salon_id)
        .neq('status', 'cancelled')

      if (error || !data) {
        setLoading(false)
        return
      }

      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

      const todayCount = data.filter((b) => {
        const startsAt = new Date(b.starts_at)
        return startsAt >= todayStart && startsAt < todayEnd
      }).length

      const clientCount = new Set(data.map((b) => b.guest_email)).size

      const monthlyRevenue = data
        .filter((b) => {
          const startsAt = new Date(b.starts_at)
          return (
            startsAt.getFullYear() === now.getFullYear() &&
            startsAt.getMonth() === now.getMonth() &&
            b.status === 'confirmed'
          )
        })
        .reduce((sum, b) => sum + (b.total_price || 0), 0)

      setStats({ todayCount, clientCount, monthlyRevenue })
      setLoading(false)
    }

    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Panel
        </h1>
        <p className="text-gray-500 mb-8">Üdvözöljük a szalon admin felületen!</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-sm text-gray-500">Mai foglalások</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">
              {loading ? '…' : stats?.todayCount ?? 0}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-sm text-gray-500">Összes ügyfél</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">
              {loading ? '…' : stats?.clientCount ?? 0}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-sm text-gray-500">Havi bevétel</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">
              {loading ? '…' : `${(stats?.monthlyRevenue ?? 0).toLocaleString('hu-HU')} Ft`}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
