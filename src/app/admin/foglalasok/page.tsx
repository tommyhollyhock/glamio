'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Booking = {
  id: string
  guest_name: string
  guest_email: string
  guest_phone: string
  booking_date: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'cancelled'
  total_price: number
  notes: string | null
  services: { name: string } | null
  staff: { name: string } | null
}

const statusLabel: Record<string, string> = {
  pending: 'Függőben',
  confirmed: 'Megerősítve',
  cancelled: 'Lemondva',
}

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function FoglalasokPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all')

  const supabase = createClient()

  const fetchBookings = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('salon_id')
      .single()

    if (!profile?.salon_id) {
      setLoading(false)
      return
    }

    let query = supabase
      .from('bookings')
      .select('id, guest_name, guest_email, guest_phone, starts_at, ends_at, status, total_price, notes, services(name), staff(name)')
      .eq('salon_id', profile.salon_id)
      .order('starts_at', { ascending: false })
      .order('start_time', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data, error } = await query
    console.log('bookings:', data, 'error:', error)
    setBookings((data as unknown as Booking[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchBookings()
  }, [filter])

  const updateStatus = async (id: string, newStatus: 'confirmed' | 'cancelled') => {
    setUpdating(id)
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id)

    if (!error) {
      const booking = bookings.find(b => b.id === id)
      if (booking?.guest_email) {
        await fetch('/api/send-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: booking.guest_email,
            name: booking.guest_name,
            status: newStatus,
            date: booking.starts_at,
            time: booking.starts_at,
            service: booking.services?.name,
          }),
        })
      }
      await fetchBookings()
    }
    setUpdating(null)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Foglalások</h1>
        <div className="flex gap-2">
          {(['all', 'pending', 'confirmed', 'cancelled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'Összes' : statusLabel[f]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Betöltés...</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Nincs foglalás</div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="min-w-[120px] text-center bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-500">
                  {new Date(booking.starts_at).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}
                </div>
                <div className="text-lg font-bold text-gray-900">{booking.starts_at?.slice(0, 5)}</div>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{booking.guest_name}</div>
                <div className="text-sm text-gray-500">{booking.guest_email} · {booking.guest_phone}</div>
                <div className="text-sm text-gray-600 mt-1">{booking.services?.name} — {booking.staff?.name}</div>
                {booking.notes && <div className="text-xs text-gray-400 mt-1">📝 {booking.notes}</div>}
              </div>
              <div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[booking.status]}`}>
                  {statusLabel[booking.status]}
                </span>
              </div>
              <div className="flex gap-2">
                {booking.status === 'pending' && (
                  <>
                    <button onClick={() => updateStatus(booking.id, 'confirmed')} disabled={updating === booking.id}
                      className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                      ✓ Megerősít
                    </button>
                    <button onClick={() => updateStatus(booking.id, 'cancelled')} disabled={updating === booking.id}
                      className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors">
                      ✕ Lemond
                    </button>
                  </>
                )}
                {booking.status === 'confirmed' && (
                  <button onClick={() => updateStatus(booking.id, 'cancelled')} disabled={updating === booking.id}
                    className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors">
                    ✕ Lemond
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}