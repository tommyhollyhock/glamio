'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type BookingInfo = {
  id: string
  status: string
  guest_name: string
  starts_at: string
  services: { name: string } | null
}

export default function LemondasPage() {
  const { token } = useParams()
  const [booking, setBooking] = useState<BookingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [result, setResult] = useState<'success' | 'error' | 'already' | null>(null)

  useEffect(() => {
    fetch(`/api/cancel/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.booking) setBooking(data.booking)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token])

  const handleCancel = async () => {
    setCancelling(true)
    const res = await fetch(`/api/cancel/${token}`, { method: 'POST' })
    const data = await res.json()
    if (data.success) {
      setResult('success')
    } else if (data.error?.includes('le van mondva')) {
      setResult('already')
    } else {
      setResult('error')
    }
    setCancelling(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Betöltés...</div>

  if (!booking) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8">
        <div className="text-4xl mb-4">😕</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Foglalás nem található</h1>
        <p className="text-gray-500">Ez a link érvénytelen vagy már lejárt.</p>
      </div>
    </div>
  )

  if (booking.status === 'cancelled' || result === 'success' || result === 'already') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8">
        <div className="text-4xl mb-4">✅</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Foglalás lemondva</h1>
        <p className="text-gray-500">A foglalásodat sikeresen lemondtuk. Ha új időpontot szeretnél, látogass vissza oldalunkra.</p>
      </div>
    </div>
  )

  const date = new Date(booking.starts_at)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4">
        <h1 className="text-xl font-bold text-gray-900 mb-4 text-center">Foglalás lemondása</h1>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 mb-6">
          <p className="text-sm"><span className="text-gray-500">Név:</span> <span className="font-medium">{booking.guest_name}</span></p>
          <p className="text-sm"><span className="text-gray-500">Szolgáltatás:</span> <span className="font-medium">{booking.services?.name || '-'}</span></p>
          <p className="text-sm"><span className="text-gray-500">Időpont:</span> <span className="font-medium">{date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })}, {date.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}</span></p>
        </div>
        <p className="text-sm text-gray-500 text-center mb-4">Biztosan le szeretnéd mondani ezt a foglalást?</p>
        {result === 'error' && <p className="text-sm text-red-600 text-center mb-4">Hiba történt, próbáld újra.</p>}
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {cancelling ? 'Lemondás...' : 'Foglalás lemondása'}
        </button>
      </div>
    </div>
  )
}
