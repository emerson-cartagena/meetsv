import { parseISO, isPast, isBefore, isAfter, startOfDay } from 'date-fns'
import type { Event, EventStatus } from '../types'

export function getEventStatus(event: Event): EventStatus {
  const today = startOfDay(new Date())
  const startDate = startOfDay(parseISO(event.date_start))
  const endDate = startOfDay(parseISO(event.date_end))

  if (isPast(endDate) || isBefore(endDate, today)) {
    return 'past'
  }

  if (isAfter(startDate, today)) {
    return 'future'
  }

  return 'active'
}

export function canEditEvent(event: Event): boolean {
  const status = getEventStatus(event)
  return status !== 'past'
}

export function getEditRestrictions(event: Event) {
  const status = getEventStatus(event)

  if (status === 'future') {
    return {
      canChangeStartDate: true,
      canChangeEndDate: true,
      canChangeWeekdays: true,
      affectsExisting: false,
      message: ''
    }
  }

  if (status === 'active') {
    return {
      canChangeStartDate: false,
      canChangeEndDate: true,
      canChangeWeekdays: true,
      affectsExisting: true,
      message: '⚠️ Cambios en fechas y días solo afectarán a reservas futuras, no a las existentes. Debes reprogramar manualmente si quieres cambiar reservas actuales.'
    }
  }

  return {
    canChangeStartDate: false,
    canChangeEndDate: false,
    canChangeWeekdays: false,
    affectsExisting: false,
    message: 'Este evento ya pasó y no puede ser editado.'
  }
}
