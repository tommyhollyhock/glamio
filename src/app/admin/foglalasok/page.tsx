'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Booking = {
  id: string
  guest_name: string
  guest_email: string
  guest_phone: string
  starts_at: string
  ends_at: string
  status: string
  total_price: number
  notes: string
  services: { name: string }
  staff: { name: string }
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
  no_show: 'bg-gray-100 text-gray-500',
}

const statusLabels: Record<string, string> = {
  pending: 'Függőben',
  confirmed: 'Megerősítve',
  cancelled: 'Lemondva',
  completed: 'Teljesítve',
  no_show: 'Nem jelent meg',
}

export default function FoglalasokPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('salon_id')
      .eq('id', user.id)
      .single()

    if (!profile?.salon_id) return

    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        services(name),
        staff(name)
      `)
      .eq('salon_id', profile.salon_id)
      .order('starts_at', { ascending: false })

    setBookings(data || [])
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('bookings').update({ status }).eq('id', id)
    fetchBookings()
  }

  const filtered = filter === 'all'
    ? bookings
    : bookings.filter((b) => b.status === filter)

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Fejléc */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Foglalások</h1>
            <p className="text-gray-500 mt-1">{bookings.length} foglalás összesen</p>
          </div>
        </div>

        {/* Szűrők */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: 'all', label: 'Összes' },
            { key: 'pending', label: 'Függőben' },
            { key: 'confirmed', label: 'Megerősítve' },
            { key: 'completed', label: 'Teljesítve' },
            { key: 'cancelled', label: 'Lemondva' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {label}
              {key !== 'all' && (
                <span className="ml-1 text-xs opacity-70">
                  ({bookings.filter((b) => b.status === key).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Betöltés...</div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-8 text-center">
              <p className="text-gray-500">Nincs foglalás ebben a kategóriában.</p>
            </div>
          ) : (
            filtered.map((booking) => (
              <div key={booking.id} className="bg-white rounded-2xl shadow p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">{booking.guest_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                        {statusLabels[booking.status]}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400">Szolgáltatás</p>
                        <p className="font-medium text-gray-700">{booking.services?.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Munkatárs</p>
                        <p className="font-medium text-gray-700">{booking.staff?.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Időpont</p>
                        <p className="font-medium text-gray-700">{formatDate(booking.starts_at)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Ár</p>
                        <p className="font-medium text-gray-700">{(booking.total_price / 100).toLocaleString('hu-HU')} Ft</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-4 text-sm text-gray-500">
                      {booking.guest_email && <span>✉️ {booking.guest_email}</span>}
                      {booking.guest_phone && <span>📞 {booking.guest_phone}</span>}
                      {booking.notes && <span>📝 {booking.notes}</span>}
                    </div>
                  </div>

                  {/* Státusz műveletek */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(booking.id, 'confirmed')}
                          className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          ✓ Megerősít
                        </button>
                        <button
                          onClick={() => updateStatus(booking.id, 'cancelled')}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
                        >
                          ✕ Lemondás
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => updateStatus(booking.id, 'completed')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        ✓ Teljesítve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}