import { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventInput, DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'
import styled from '@emotion/styled'
import {
  getTutorAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  type Appointment,
  type AppointmentStatus,
} from '../api/client'

const CalendarWrapper = styled.div`
  flex: 1;
  padding: 20px;
  
  .fc {
    height: 100%;
    font-family: var(--sans);
  }
  
  .fc-toolbar-title {
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .fc-button {
    background: var(--accent-bg);
    border: 1px solid var(--accent-border);
    color: var(--accent);
    font-family: var(--sans);
    padding: 6px 12px;
    border-radius: 6px;
    transition: box-shadow 0.2s;
    
    &:hover {
      background: var(--accent-bg);
      box-shadow: var(--shadow);
    }
    
    &:disabled {
      opacity: 0.5;
    }
    
    &.fc-button-active {
      background: var(--accent);
      color: white;
    }
  }
  
  .fc-event {
    cursor: pointer;
    border-radius: 4px;
    padding: 2px 4px;
    font-size: 0.85rem;
  }
  
  .fc-event-available {
    background: var(--accent);
    border-color: var(--accent);
  }
  
  .fc-event-booked {
    background: #10b981;
    border-color: #10b981;
  }
  
  .fc-event-cancelled {
    background: #ef4444;
    border-color: #ef4444;
    text-decoration: line-through;
  }
  
  .fc-event-completed {
    background: #6b7280;
    border-color: #6b7280;
  }
  
  .fc-daygrid-day-number,
  .fc-col-header-cell-cushion {
    color: var(--text);
  }
  
  .fc-day-today {
    background: var(--accent-bg) !important;
  }
`

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

const ModalContent = styled.div`
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
  box-shadow: var(--shadow);
`

const ModalTitle = styled.h3`
  margin: 0 0 20px;
  font-size: 1.25rem;
  color: var(--text-h);
`

const FormGroup = styled.div`
  margin-bottom: 16px;
`

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-size: 0.875rem;
  color: var(--text);
  font-weight: 500;
`

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 1rem;
  font-family: var(--sans);
  background: var(--bg);
  color: var(--text);
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: var(--accent);
  }
`

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 1rem;
  font-family: var(--sans);
  background: var(--bg);
  color: var(--text);
  resize: vertical;
  min-height: 80px;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: var(--accent);
  }
`

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 1rem;
  font-family: var(--sans);
  background: var(--bg);
  color: var(--text);
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: var(--accent);
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  flex: 1;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 1rem;
  font-family: var(--sans);
  cursor: pointer;
  transition: box-shadow 0.2s;
  
  ${({ variant = 'secondary' }) => {
    switch (variant) {
      case 'primary':
        return `
          background: var(--accent);
          color: white;
          border: none;
        `
      case 'danger':
        return `
          background: #ef4444;
          color: white;
          border: none;
        `
      default:
        return `
          background: var(--bg);
          color: var(--text);
          border: 1px solid var(--border);
        `
    }
  }}
  
  &:hover {
    box-shadow: var(--shadow);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const ErrorMessage = styled.div`
  background: #fef2f2;
  color: #dc2626;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 0.875rem;
`

interface AppointmentModalProps {
  isOpen: boolean
  appointment?: Appointment | null
  defaultStart?: Date
  defaultEnd?: Date
  onClose: () => void
  onSave: (data: {
    title: string
    description?: string
    startTime: string
    endTime: string
    status?: AppointmentStatus
  }) => Promise<void>
  onDelete?: () => Promise<void>
}

function AppointmentModal({
  isOpen,
  appointment,
  defaultStart,
  defaultEnd,
  onClose,
  onSave,
  onDelete,
}: AppointmentModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [status, setStatus] = useState<AppointmentStatus>('available')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (appointment) {
      setTitle(appointment.title)
      setDescription(appointment.description || '')
      setStartTime(formatDateTimeLocal(new Date(appointment.startTime)))
      setEndTime(formatDateTimeLocal(new Date(appointment.endTime)))
      setStatus(appointment.status)
    } else if (defaultStart && defaultEnd) {
      setTitle('')
      setDescription('')
      setStartTime(formatDateTimeLocal(defaultStart))
      setEndTime(formatDateTimeLocal(defaultEnd))
      setStatus('available')
    }
    setError(null)
  }, [appointment, defaultStart, defaultEnd, isOpen])

  function formatDateTimeLocal(date: Date): string {
    const offset = date.getTimezoneOffset()
    const localDate = new Date(date.getTime() - offset * 60 * 1000)
    return localDate.toISOString().slice(0, 16)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await onSave({
        title,
        description: description || undefined,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        status: appointment ? status : undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save appointment')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete || !confirm('Are you sure you want to delete this appointment?')) return
    
    setError(null)
    setLoading(true)

    try {
      await onDelete()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete appointment')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalTitle>{appointment ? 'Edit Appointment' : 'New Appointment'}</ModalTitle>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Math Tutoring Session"
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="description">Description</Label>
            <TextArea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details about the appointment..."
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="startTime">Start Time *</Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="endTime">End Time *</Label>
            <Input
              id="endTime"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </FormGroup>
          
          {appointment && (
            <FormGroup>
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
              >
                <option value="available">Available</option>
                <option value="booked">Booked</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </FormGroup>
          )}
          
          <ButtonGroup>
            <Button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            {appointment && onDelete && (
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </Button>
            )}
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </ButtonGroup>
        </form>
      </ModalContent>
    </Modal>
  )
}

export function TutorCalendar() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [defaultStart, setDefaultStart] = useState<Date | undefined>()
  const [defaultEnd, setDefaultEnd] = useState<Date | undefined>()
  const calendarRef = useRef<FullCalendar>(null)

  // Fetch appointments on mount
  useEffect(() => {
    fetchAppointments()
  }, [])

  async function fetchAppointments() {
    try {
      setLoading(true)
      const data = await getTutorAppointments()
      setAppointments(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch appointments')
    } finally {
      setLoading(false)
    }
  }

  // Convert appointments to FullCalendar events
  const events: EventInput[] = appointments.map((apt) => ({
    id: apt.id,
    title: apt.title,
    start: apt.startTime,
    end: apt.endTime,
    extendedProps: {
      description: apt.description,
      status: apt.status,
      clientId: apt.clientId,
    },
    classNames: [`fc-event-${apt.status}`],
  }))

  // Handle date selection (create new appointment)
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedAppointment(null)
    setDefaultStart(selectInfo.start)
    setDefaultEnd(selectInfo.end)
    setModalOpen(true)
    
    // Clear the selection
    const calendarApi = selectInfo.view.calendar
    calendarApi.unselect()
  }

  // Handle event click (edit appointment)
  const handleEventClick = (clickInfo: EventClickArg) => {
    const apt = appointments.find((a) => a.id === clickInfo.event.id)
    if (apt) {
      setSelectedAppointment(apt)
      setDefaultStart(undefined)
      setDefaultEnd(undefined)
      setModalOpen(true)
    }
  }

  // Handle event drag & drop
  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const { event } = dropInfo
    const apt = appointments.find((a) => a.id === event.id)
    if (!apt || !event.start || !event.end) {
      dropInfo.revert()
      return
    }

    try {
      await updateAppointment(apt.id, {
        startTime: event.start.toISOString(),
        endTime: event.end.toISOString(),
      })
      await fetchAppointments()
    } catch (err) {
      dropInfo.revert()
      setError(err instanceof Error ? err.message : 'Failed to update appointment')
    }
  }

  // Handle event resize
  const handleEventResize = async (resizeInfo: EventResizeDoneArg) => {
    const { event } = resizeInfo
    const apt = appointments.find((a) => a.id === event.id)
    if (!apt || !event.start || !event.end) {
      resizeInfo.revert()
      return
    }

    try {
      await updateAppointment(apt.id, {
        startTime: event.start.toISOString(),
        endTime: event.end.toISOString(),
      })
      await fetchAppointments()
    } catch (err) {
      resizeInfo.revert()
      setError(err instanceof Error ? err.message : 'Failed to update appointment')
    }
  }

  // Save appointment (create or update)
  const handleSaveAppointment = async (data: {
    title: string
    description?: string
    startTime: string
    endTime: string
    status?: AppointmentStatus
  }) => {
    if (selectedAppointment) {
      // Update existing
      await updateAppointment(selectedAppointment.id, data)
    } else {
      // Create new
      await createAppointment(data)
    }
    await fetchAppointments()
  }

  // Delete appointment
  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return
    await deleteAppointment(selectedAppointment.id)
    await fetchAppointments()
  }

  if (loading) {
    return (
      <CalendarWrapper>
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading calendar...</div>
      </CalendarWrapper>
    )
  }

  return (
    <CalendarWrapper>
      {error && (
        <ErrorMessage style={{ marginBottom: '16px' }}>
          {error}
          <button
            onClick={() => setError(null)}
            style={{ marginLeft: '12px', cursor: 'pointer' }}
          >
            Dismiss
          </button>
        </ErrorMessage>
      )}
      
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        selectable={true}
        selectMirror={true}
        editable={true}
        dayMaxEvents={true}
        weekends={true}
        select={handleDateSelect}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        nowIndicator={true}
        height="100%"
      />
      
      <AppointmentModal
        isOpen={modalOpen}
        appointment={selectedAppointment}
        defaultStart={defaultStart}
        defaultEnd={defaultEnd}
        onClose={() => {
          setModalOpen(false)
          setSelectedAppointment(null)
        }}
        onSave={handleSaveAppointment}
        onDelete={selectedAppointment ? handleDeleteAppointment : undefined}
      />
    </CalendarWrapper>
  )
}
