'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Service = {
  id: string
  name: string
  category: string
  duration_min: number
  price: number
  deposit_pct: number
  is_active: boolean
}

export default function SzolgaltatasokPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    category: '',
    duration_min: 60,
    price: 0,
    deposit_pct: 0,
  })

  const supabase = createClient()

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .order('name')
    setServices(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Egyelőre az első szalonhoz adjuk (később multi-tenant)
    const { data: profile } = await supabase
      .from('profiles')
      .select('salon_id')
      .eq('id', user.id)
      .single()

    if (!profile?.salon_id) {
      alert('Nincs szalonhoz rendelve a fiókod. Először hozz létre egy szalont.')
      return
    }

    await supabase.from('services').insert({
      ...form,
      price: form.price * 100, // forintból fillérbe
      salon_id: profile.salon_id,
    })

    setForm({ name: '', category: '', duration_min: 60, price: 0, deposit_pct: 0 })
    setShowForm(false)
    fetchServices()
  }

  const toggleActive = async (id: string, current: boolean) => {
    await supabase
      .from('services')
      .update({ is_active: !current })
      .eq('id', id)
    fetchServices()
  }

  const categories = [
    'Manikűr', 'Pedikűr', 'Géllakk', 'Műköröm',
    'Szempilla', 'Szemöldök', 'Hajvágás', 'Hajfestés',
    'Hajkezelés', 'Masszázs', 'Egyéb'
  ]

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Fejléc */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Szolgáltatások</h1>
            <p className="text-gray-500 mt-1">Kezeld a szalon által kínált szolgáltatásokat</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + Új szolgáltatás
          </button>
        </div>

        {/* Új szolgáltatás form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Új szolgáltatás</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Név</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="pl. Géllakk manikűr"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategória</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Válassz...</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Időtartam (perc)</label>
                <input
                  type="number"
                  value={form.duration_min}
                  onChange={(e) => setForm({ ...form, duration_min: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="15"
                  step="15"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ár (Ft)</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Előleg (%)</label>
                <input
                  type="number"
                  value={form.deposit_pct}
                  onChange={(e) => setForm({ ...form, deposit_pct: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="0"
                  max="100"
                />
              </div>

              <div className="col-span-2 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Mégsem
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Mentés
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Szolgáltatások listája */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Betöltés...</div>
          ) : services.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Még nincs szolgáltatás felvéve.</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-indigo-600 text-sm font-medium hover:underline"
              >
                Adj hozzá egyet →
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Név</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategória</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Időtartam</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ár</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Előleg</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Státusz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{service.name}</td>
                    <td className="px-6 py-4 text-gray-500">{service.category}</td>
                    <td className="px-6 py-4 text-gray-500">{service.duration_min} perc</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{(service.price / 100).toLocaleString('hu-HU')} Ft</td>
                    <td className="px-6 py-4 text-gray-500">{service.deposit_pct}%</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(service.id, service.is_active)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          service.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {service.is_active ? 'Aktív' : 'Inaktív'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}