'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type SalonData = {
  id: string
  name: string
  slug: string
  type: string
  phone: string
  email: string
  address: { city?: string; street?: string; zip?: string }
  logo_url: string
  cover_url: string
}

const salonTypes = [
  { value: 'nail', label: 'Köröm' },
  { value: 'hair', label: 'Fodrász' },
  { value: 'lash', label: 'Pillás' },
  { value: 'massage', label: 'Masszázs' },
  { value: 'beauty', label: 'Szépségszalon' },
  { value: 'other', label: 'Egyéb' },
]

export default function BeallitasokPage() {
  const [salon, setSalon] = useState<SalonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchSalon = async () => {
      const { data: profile } = await supabase.from('profiles').select('salon_id').single()
      if (!profile?.salon_id) return
      const { data } = await supabase.from('salons').select('id, name, slug, type, phone, email, address, logo_url, cover_url').eq('id', profile.salon_id).single()
      if (data) {
        setSalon({ ...data, phone: data.phone || '', email: data.email || '', type: data.type || 'beauty', address: data.address || { city: '', street: '', zip: '' }, logo_url: data.logo_url || '', cover_url: data.cover_url || '' })
      }
      setLoading(false)
    }
    fetchSalon()
  }, [])

  const handleSave = async () => {
    if (!salon) return
    setSaving(true)
    setMessage(null)
    const { error } = await supabase.from('salons').update({ name: salon.name, slug: salon.slug, type: salon.type, phone: salon.phone, email: salon.email, address: salon.address, logo_url: salon.logo_url, cover_url: salon.cover_url }).eq('id', salon.id)
    if (error) { setMessage({ type: 'error', text: 'Hiba: ' + error.message }) } else { setMessage({ type: 'success', text: 'Beállítások mentve!' }); setTimeout(() => setMessage(null), 3000) }
    setSaving(false)
  }

  const updateField = (field: keyof SalonData, value: string) => { if (!salon) return; setSalon({ ...salon, [field]: value }) }
  const updateAddress = (field: string, value: string) => { if (!salon) return; setSalon({ ...salon, address: { ...salon.address, [field]: value } }) }

  if (loading) return <div className="p-6 text-center text-gray-400">Betöltés...</div>
  if (!salon) return <div className="p-6 text-center text-red-500">Szalon nem található</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Szalon beállítások</h1>
      {message && (<div className={`mb-4 p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{message.text}</div>)}
      <div className="bg-white rounded-2xl shadow p-6 space-y-5">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Szalon neve</label><input type="text" value={salon.name} onChange={(e) => updateField('name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">URL slug</label><div className="flex items-center gap-2"><span className="text-sm text-gray-400">glamio.hu/</span><input type="text" value={salon.slug} onChange={(e) => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" /></div></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Szalon típusa</label><select value={salon.type} onChange={(e) => updateField('type', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">{salonTypes.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}</select></div>
        <hr className="border-gray-100" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label><input type="tel" value={salon.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="+36 30 123 4567" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={salon.email} onChange={(e) => updateField('email', e.target.value)} placeholder="info@szalon.hu" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" /></div></div>
        <hr className="border-gray-100" />
        <div><label className="block text-sm font-medium text-gray-700 mb-2">Cím</label><div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><input type="text" value={salon.address?.zip || ''} onChange={(e) => updateAddress('zip', e.target.value)} placeholder="Irányítószám" className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" /><input type="text" value={salon.address?.city || ''} onChange={(e) => updateAddress('city', e.target.value)} placeholder="Város" className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" /><input type="text" value={salon.address?.street || ''} onChange={(e) => updateAddress('street', e.target.value)} placeholder="Utca, házszám" className="col-span-1 sm:col-span-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" /></div></div>
        <hr className="border-gray-100" />
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Logó URL</label><input type="url" value={salon.logo_url} onChange={(e) => updateField('logo_url', e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />{salon.logo_url && (<img src={salon.logo_url} alt="Logó" className="mt-2 h-16 rounded-lg object-contain" />)}</div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Borítókép URL</label><input type="url" value={salon.cover_url} onChange={(e) => updateField('cover_url', e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />{salon.cover_url && (<img src={salon.cover_url} alt="Borító" className="mt-2 h-32 w-full rounded-lg object-cover" />)}</div>
        <button onClick={handleSave} disabled={saving} className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">{saving ? 'Mentés...' : 'Beállítások mentése'}</button>
      </div>
    </div>
  )
}
