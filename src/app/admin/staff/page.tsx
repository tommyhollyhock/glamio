'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type StaffMember = {
  id: string
  name: string
  bio: string
  color: string
  is_active: boolean
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    bio: '',
    color: '#6366f1',
  })

  const supabase = createClient()

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    const { data } = await supabase
      .from('staff')
      .select('*')
      .order('name')
    setStaff(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('salon_id')
      .eq('id', user.id)
      .single()

    if (!profile?.salon_id) return

    await supabase.from('staff').insert({
      ...form,
      salon_id: profile.salon_id,
    })

    setForm({ name: '', bio: '', color: '#6366f1' })
    setShowForm(false)
    fetchStaff()
  }

  const toggleActive = async (id: string, current: boolean) => {
    await supabase
      .from('staff')
      .update({ is_active: !current })
      .eq('id', id)
    fetchStaff()
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Fejléc */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Munkatársak</h1>
            <p className="text-gray-500 mt-1">Kezeld a szalon dolgozóit</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + Új munkatárs
          </button>
        </div>

        {/* Új munkatárs form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Új munkatárs</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Név</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="pl. Kovács Anna"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bemutatkozás</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Rövid bemutatkozás..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Naptár szín
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                  />
                  <span className="text-sm text-gray-500">{form.color}</span>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
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

        {/* Staff lista */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 text-center text-gray-500 py-8">Betöltés...</div>
          ) : staff.length === 0 ? (
            <div className="col-span-2 bg-white rounded-2xl shadow p-8 text-center">
              <p className="text-gray-500">Még nincs munkatárs felvéve.</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-indigo-600 text-sm font-medium hover:underline"
              >
                Adj hozzá egyet →
              </button>
            </div>
          ) : (
            staff.map((member) => (
              <div key={member.id} className="bg-white rounded-2xl shadow p-6 flex items-start gap-4">
                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ backgroundColor: member.color }}
                >
                  {member.name.charAt(0)}
                </div>

                {/* Adatok */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{member.name}</h3>
                    <button
                      onClick={() => toggleActive(member.id, member.is_active)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        member.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {member.is_active ? 'Aktív' : 'Inaktív'}
                    </button>
                  </div>
                  {member.bio && (
                    <p className="text-sm text-gray-500 mt-1">{member.bio}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}