'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const DAYS = [
  { label: 'Hétfő',     value: 1 },
  { label: 'Kedd',      value: 2 },
  { label: 'Szerda',    value: 3 },
  { label: 'Csütörtök', value: 4 },
  { label: 'Péntek',    value: 5 },
  { label: 'Szombat',   value: 6 },
  { label: 'Vasárnap',  value: 7 },
]

type StaffMember = { id: string; name: string; color: string }
type DaySchedule = { enabled: boolean; start: string; end: string }
type Schedule = Record<number, DaySchedule>

const defaultSchedule = (): Schedule =>
  Object.fromEntries(DAYS.map(d => [d.value, { enabled: false, start: '09:00', end: '17:00' }]))

export default function MunkaidoPage() {
  const supabase = createClient()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string>('')
  const [schedule, setSchedule] = useState<Schedule>(defaultSchedule())
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('salon_id').eq('id', user.id).single().then(({ data }) => {
        if (!data) return
        supabase.from('staff').select('id, name, color').eq('salon_id', data.salon_id).eq('is_active', true).order('name').then(({ data: s }) => {
          if (!s || s.length === 0) return
          setStaff(s)
          setSelectedStaff(s[0].id)
        })
      })
    })
  }, [])

  useEffect(() => {
    if (!selectedStaff) return
    supabase.from('working_hours').select('*').eq('staff_id', selectedStaff).then(({ data }) => {
      const s = defaultSchedule()
      if (data) {
        data.forEach(row => {
          s[row.day_of_week] = { enabled: true, start: row.start_time.slice(0, 5), end: row.end_time.slice(0, 5) }
        })
      }
      setSchedule(s)
    })
  }, [selectedStaff])

  const save = async () => {
    if (!selectedStaff) return
    setLoading(true)
    setSaved(false)
    await supabase.from('working_hours').delete().eq('staff_id', selectedStaff)
    const rows = DAYS.filter(d => schedule[d.value].enabled).map(d => ({
      staff_id: selectedStaff,
      day_of_week: d.value,
      start_time: schedule[d.value].start,
      end_time: schedule[d.value].end,
    }))
    if (rows.length > 0) {
      await supabase.from('working_hours').insert(rows)
    }
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const toggle = (day: number) =>
    setSchedule(s => ({ ...s, [day]: { ...s[day], enabled: !s[day].enabled } }))

  const setTime = (day: number, field: 'start' | 'end', val: string) =>
    setSchedule(s => ({ ...s, [day]: { ...s[day], [field]: val } }))

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Munkaidő beállítás</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Munkatárs</label>
        <div className="flex gap-2 flex-wrap">
          {staff.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedStaff(m.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedStaff === m.id ? 'text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={selectedStaff === m.id ? { backgroundColor: m.color } : {}}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: m.color }}>
                {m.name.charAt(0)}
              </span>
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 space-y-3">
        {DAYS.map(d => (
          <div key={d.value} className={`flex items-center gap-4 py-3 border-b border-gray-50 last:border-0 ${!schedule[d.value].enabled ? 'opacity-50' : ''}`}>
            <button
              onClick={() => toggle(d.value)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${schedule[d.value].enabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${schedule[d.value].enabled ? 'translate-x-5' : ''}`} />
            </button>
            <span className="w-24 text-sm font-medium text-gray-900">{d.label}</span>
            {schedule[d.value].enabled ? (
              <div className="flex items-center gap-2 ml-auto">
                <input type="time" value={schedule[d.value].start}
                  onChange={e => setTime(d.value, 'start', e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <span className="text-gray-400 text-sm">–</span>
                <input type="time" value={schedule[d.value].end}
                  onChange={e => setTime(d.value, 'end', e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            ) : (
              <span className="ml-auto text-sm text-gray-400">Szabad nap</span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button onClick={save} disabled={loading || !selectedStaff}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {loading ? 'Mentés...' : '💾 Munkaidő mentése'}
        </button>
        {saved && <span className="text-green-600 text-sm font-medium">✓ Sikeresen mentve!</span>}
      </div>
    </div>
  )
}
