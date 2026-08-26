import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const BUFFER_MIN = 15
const SLOT_STEP = 30

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const staffId  = searchParams.get('staff_id')
  const salonId  = searchParams.get('salon_id')
  const date     = searchParams.get('date')
  const duration = parseInt(searchParams.get('duration') || '60')

  if (!salonId || !date) {
    return NextResponse.json({ error: 'Hiányzó paraméter' }, { status: 400 })
  }

  const supabase = await createClient()

  const jsDay = new Date(date).getDay()
  const dayOfWeek = jsDay === 0 ? 7 : jsDay

  let whQuery = supabase
    .from('working_hours')
    .select('start_time, end_time, staff_id')
    .eq('day_of_week', dayOfWeek)
    

  if (staffId) {
    whQuery = whQuery.eq('staff_id', staffId)
  } else {
    const { data: allStaff } = await supabase
      .from('staff')
      .select('id')
      .eq('salon_id', salonId)
      
    const ids = (allStaff || []).map(s => s.id)
    whQuery = whQuery.in('staff_id', ids)
  }

  const { data: workingHours } = await whQuery

  if (!workingHours || workingHours.length === 0) {
    return NextResponse.json({ slots: [] })
  }

  let exQuery = supabase
    .from('schedule_exceptions')
    .select('*')
    .eq('date', date)

  if (staffId) {
    exQuery = exQuery.eq('staff_id', staffId)
  }

  const { data: exceptions } = await exQuery

  const fullDayClosed = (exceptions || []).some(e => e.is_closed)
  if (fullDayClosed) {
    return NextResponse.json({ slots: [] })
  }

  const dayStart = `${date}T00:00:00`
  const dayEnd   = `${date}T23:59:59`

  let bkQuery = supabase
    .from('bookings')
    .select('starts_at, ends_at, staff_id')
    .gte('starts_at', dayStart)
    .lte('starts_at', dayEnd)
    .in('status', ['confirmed', 'pending'])

  if (staffId) {
    bkQuery = bkQuery.eq('staff_id', staffId)
  }

  const { data: bookings } = await bkQuery

  const availableSlots = new Set<string>()

  for (const wh of workingHours) {
    const [startH, startM] = wh.start_time.split(':').map(Number)
    const [endH, endM]     = wh.end_time.split(':').map(Number)

    const workStart = startH * 60 + startM
    const workEnd   = endH * 60 + endM

    const staffBookings = (bookings || []).filter(b =>
      !staffId || b.staff_id === wh.staff_id
    )

    const busyBlocks = staffBookings.map(b => {
      const s = new Date(b.starts_at)
      const e = new Date(b.ends_at)
      return {
        start: s.getHours() * 60 + s.getMinutes(),
        end:   e.getHours() * 60 + e.getMinutes() + BUFFER_MIN
      }
    })

    const ex = (exceptions || []).find(e => e.staff_id === wh.staff_id && !e.is_closed)
    const effectiveStart = ex ? timeToMin(ex.start_time) : workStart
    const effectiveEnd   = ex ? timeToMin(ex.end_time)   : workEnd

    for (let t = effectiveStart; t + duration <= effectiveEnd; t += SLOT_STEP) {
      const slotEnd = t + duration
      const isBlocked = busyBlocks.some(b => t < b.end && slotEnd > b.start)
      if (!isBlocked) {
        availableSlots.add(minToTime(t))
      }
    }
  }

  const now = new Date()
  const isToday = date === now.toISOString().split('T')[0]
  const nowMin  = now.getHours() * 60 + now.getMinutes() + 30

  const slots = Array.from(availableSlots)
    .filter(t => !isToday || timeToMin(t) >= nowMin)
    .sort()

  return NextResponse.json({ slots })
}

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minToTime(min: number): string {
  const h = Math.floor(min / 60).toString().padStart(2, '0')
  const m = (min % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}
