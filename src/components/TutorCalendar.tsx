import { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import type { EventInput, EventClickArg } from '@fullcalendar/core'
import styled from '@emotion/styled'
import {
  getTutorAvailability,
  getTutorBookingRequests,
  updateBookingRequestStatus,
  type AvailabilitySlot,
  type BookingRequest,
  type DayOfWeek,
} from '../api/client'

const CalendarWrapper = styled.div`
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  
  .fc {
    flex: 1;
    min-height: 0;
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
  
  /* Background availability slots */
  .fc-event-availability {
    background: #e0f2fe !important;
    border-color: #7dd3fc !important;
    opacity: 0.7;
    cursor: default;
  }
  
  /* Pending booking requests - orange with dashed border */
  .fc-event-pending {
    background: #f59e0b;
    border-color: #d97706;
    border-style: dashed;
    border-width: 2px;
  }
  
  /* Confirmed/accepted bookings - green solid */
  .fc-event-confirmed {
    background: #10b981;
    border-color: #059669;
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
  padding: 24px;
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`

const ModalTitle = styled.h2`
  margin: 0 0 20px 0;
  font-size: 1.25rem;
  font-weight: 600;
`

const RequestDetail = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
  
  &:last-of-type {
    border-bottom: none;
  }
  
  strong {
    font-size: 0.75rem;
    color: var(--text);
    opacity: 0.7;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  span {
    font-size: 0.95rem;
  }
`

const StatusBadge = styled.span<{ status: string }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  background: ${({ status }) => 
    status === 'pending' ? '#fef3c7' : 
    status === 'accepted' ? '#d1fae5' : 
    '#fee2e2'};
  color: ${({ status }) => 
    status === 'pending' ? '#d97706' : 
    status === 'accepted' ? '#059669' : 
    '#dc2626'};
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`

const Button = styled.button<{ variant?: 'primary' | 'danger' }>`
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  
  ${({ variant }) => variant === 'primary' && `
    background: var(--accent);
    color: white;
    border-color: var(--accent);
  `}
  
  ${({ variant }) => variant === 'danger' && `
    background: #fee2e2;
    color: #dc2626;
    border-color: #fecaca;
  `}
  
  &:hover {
    opacity: 0.9;
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

const Legend = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--accent-bg);
  border-radius: 8px;
  font-size: 0.875rem;
`

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const LegendColor = styled.div<{ color: string; dashed?: boolean }>`
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: ${({ color }) => color};
  ${({ dashed }) => dashed && `
    border: 2px dashed #d97706;
    background: #f59e0b;
  `}
`

// Generate recurring availability events for the visible date range
function generateAvailabilityEvents(
  slots: AvailabilitySlot[],
  startDate: Date,
  endDate: Date
): EventInput[] {
  const events: EventInput[] = []
  const seenDates = new Set<string>()
  
  // Iterate through each day in the range
  const current = new Date(startDate)
  current.setHours(0, 0, 0, 0)
  
  while (current <= endDate) {
    const currentDayOfWeek = current.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as DayOfWeek
    
    for (const slot of slots) {
      if (slot.dayOfWeek === currentDayOfWeek) {
        const dateKey = `${slot.id}-${current.toISOString().split('T')[0]}`
        
        // Avoid duplicates
        if (!seenDates.has(dateKey)) {
          seenDates.add(dateKey)
          
          const [startHour, startMin] = slot.startTime.split(':').map(Number)
          const [endHour, endMin] = slot.endTime.split(':').map(Number)
          
          const eventStart = new Date(current)
          eventStart.setHours(startHour, startMin, 0, 0)
          
          const eventEnd = new Date(current)
          eventEnd.setHours(endHour, endMin, 0, 0)
          
          events.push({
            id: `availability-${dateKey}`,
            title: 'Available',
            start: eventStart.toISOString(),
            end: eventEnd.toISOString(),
            display: 'background',
            classNames: ['fc-event-availability'],
            extendedProps: { type: 'availability' },
          })
        }
      }
    }
    
    // Move to next day
    current.setDate(current.getDate() + 1)
  }
  
  return events
}

function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface RequestModalProps {
  request: BookingRequest | null
  onClose: () => void
  onAccept: (id: string) => Promise<void>
  onDecline: (id: string) => Promise<void>
}

function RequestModal({ request, onClose, onAccept, onDecline }: RequestModalProps) {
  const [loading, setLoading] = useState(false)

  if (!request) return null

  const handleAccept = async () => {
    setLoading(true)
    try {
      await onAccept(request.id)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleDecline = async () => {
    if (!confirm('Are you sure you want to decline this booking request?')) return
    setLoading(true)
    try {
      await onDecline(request.id)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalTitle>Booking Request</ModalTitle>
        
        <RequestDetail>
          <strong>Status</strong>
          <StatusBadge status={request.status}>{request.status}</StatusBadge>
        </RequestDetail>
        
        <RequestDetail>
          <strong>Session Title</strong>
          <span>{request.title}</span>
        </RequestDetail>
        
        <RequestDetail>
          <strong>Client</strong>
          <span>{request.client?.name || request.client?.email || 'Unknown'}</span>
        </RequestDetail>
        
        <RequestDetail>
          <strong>Start Time</strong>
          <span>{formatDateTime(request.startTime)}</span>
        </RequestDetail>
        
        <RequestDetail>
          <strong>End Time</strong>
          <span>{formatDateTime(request.endTime)}</span>
        </RequestDetail>
        
        {request.message && (
          <RequestDetail>
            <strong>Message</strong>
            <span>{request.message}</span>
          </RequestDetail>
        )}
        
        <ButtonGroup>
          <Button type="button" onClick={onClose} disabled={loading}>
            Close
          </Button>
          {request.status === 'pending' && (
            <>
              <Button
                type="button"
                variant="danger"
                onClick={handleDecline}
                disabled={loading}
              >
                Decline
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleAccept}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Accept'}
              </Button>
            </>
          )}
        </ButtonGroup>
      </ModalContent>
    </Modal>
  )
}

export function TutorCalendar() {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null)
  const [visibleRange, setVisibleRange] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days ahead
  })
  const calendarRef = useRef<FullCalendar>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const [availabilityData, requestsData] = await Promise.all([
        getTutorAvailability(),
        getTutorBookingRequests(),
      ])
      setAvailability(availabilityData)
      setBookingRequests(requestsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  // Generate availability background events
  const availabilityEvents = generateAvailabilityEvents(
    availability,
    visibleRange.start,
    visibleRange.end
  )

  // Convert booking requests to FullCalendar events
  const requestEvents: EventInput[] = bookingRequests
    .filter(req => req.status === 'pending' || req.status === 'accepted')
    .map((req) => ({
      id: `request-${req.id}`,
      title: req.status === 'pending' 
        ? `⏳ ${req.title}` 
        : `✓ ${req.title}`,
      start: req.startTime,
      end: req.endTime,
      extendedProps: {
        type: 'request',
        request: req,
      },
      classNames: [req.status === 'pending' ? 'fc-event-pending' : 'fc-event-confirmed'],
    }))

  const events: EventInput[] = [...availabilityEvents, ...requestEvents]
  
  // Debug logging
  console.log('[TutorCalendar] Availability slots:', availability.length)
  console.log('[TutorCalendar] Booking requests:', bookingRequests.length, bookingRequests.map(r => ({ id: r.id, status: r.status, title: r.title })))
  console.log('[TutorCalendar] Availability events:', availabilityEvents.length)
  console.log('[TutorCalendar] Request events:', requestEvents.length)
  console.log('[TutorCalendar] Total events:', events.length)

  const handleEventClick = (clickInfo: EventClickArg) => {
    const { type, request } = clickInfo.event.extendedProps
    
    if (type === 'request' && request) {
      setSelectedRequest(request as BookingRequest)
    }
    // Clicking on availability background does nothing
  }

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await updateBookingRequestStatus(requestId, 'accepted')
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept request')
    }
  }

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await updateBookingRequestStatus(requestId, 'declined')
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline request')
    }
  }

  const handleDatesSet = (dateInfo: { start: Date; end: Date }) => {
    setVisibleRange({ start: dateInfo.start, end: dateInfo.end })
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
        <ErrorMessage>
          {error}
          <button
            onClick={() => setError(null)}
            style={{ marginLeft: '12px', cursor: 'pointer' }}
          >
            Dismiss
          </button>
        </ErrorMessage>
      )}
      
      <Legend>
        <LegendItem>
          <LegendColor color="#e0f2fe" />
          <span>Your Availability</span>
        </LegendItem>
        <LegendItem>
          <LegendColor color="#f59e0b" dashed />
          <span>Pending Request</span>
        </LegendItem>
        <LegendItem>
          <LegendColor color="#10b981" />
          <span>Confirmed Booking</span>
        </LegendItem>
      </Legend>
      
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        eventClick={handleEventClick}
        datesSet={handleDatesSet}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        nowIndicator={true}
        height="100%"
      />
      
      <RequestModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onAccept={handleAcceptRequest}
        onDecline={handleDeclineRequest}
      />
    </CalendarWrapper>
  )
}
