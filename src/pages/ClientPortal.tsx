import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import styled from '@emotion/styled'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventInput, DateSelectArg, EventClickArg } from '@fullcalendar/core'
import {
  getAllTutors,
  getPublicTutorAvailability,
  getClientBookingRequests,
  createBookingRequest,
  cancelBookingRequest,
  type Tutor,
  type AvailabilitySlot,
  type BookingRequest,
  type DayOfWeek,
} from '../api/client'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  border-bottom: 1px solid var(--border);
  gap: 12px;
  flex-shrink: 0;
`

const Logo = styled.h1`
  margin: 0;
  font-size: 20px;
`

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

const UserEmail = styled.span`
  font-size: 14px;
  color: var(--text);
`

const LogoutBtn = styled.button`
  font-size: 14px;
  padding: 6px 16px;
  border-radius: 6px;
  color: var(--accent);
  background: var(--accent-bg);
  border: 2px solid var(--accent-border);
  font-family: var(--sans);
  cursor: pointer;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: var(--shadow);
  }
`

const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`

const Sidebar = styled.aside`
  width: 280px;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
`

const SidebarSection = styled.div`
  padding: 16px;
  border-bottom: 1px solid var(--border);
`

const SectionTitle = styled.h3`
  margin: 0 0 12px;
  font-size: 14px;
  text-transform: uppercase;
  color: var(--text);
  letter-spacing: 0.5px;
`

const TutorList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
`

const TutorItem = styled.button<{ selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${({ selected }) => selected ? 'var(--accent)' : 'var(--border)'};
  background: ${({ selected }) => selected ? 'var(--accent-bg)' : 'var(--bg)'};
  cursor: pointer;
  text-align: left;
  font-family: var(--sans);
  transition: all 0.2s;

  &:hover {
    border-color: var(--accent);
  }
`

const TutorAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
`

const TutorInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const TutorName = styled.div`
  font-weight: 500;
  color: var(--text-h);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const TutorEmail = styled.div`
  font-size: 12px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid var(--border);
`

const Tab = styled.button<{ active?: boolean }>`
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid ${({ active }) => active ? 'var(--accent)' : 'var(--border)'};
  background: ${({ active }) => active ? 'var(--accent)' : 'var(--bg)'};
  color: ${({ active }) => active ? 'white' : 'var(--text)'};
  font-family: var(--sans);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--accent);
  }
`

const RequestsList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`

const RequestCard = styled.div<{ status: string }>`
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  margin-bottom: 12px;
  background: var(--bg);

  ${({ status }) => {
    switch (status) {
      case 'accepted':
        return 'border-left: 3px solid #10b981;'
      case 'declined':
        return 'border-left: 3px solid #ef4444;'
      default:
        return 'border-left: 3px solid var(--accent);'
    }
  }}
`

const RequestTitle = styled.div`
  font-weight: 500;
  color: var(--text-h);
  margin-bottom: 4px;
`

const RequestMeta = styled.div`
  font-size: 12px;
  color: var(--text);
  margin-bottom: 8px;
`

const RequestStatus = styled.span<{ status: string }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 500;

  ${({ status }) => {
    switch (status) {
      case 'accepted':
        return 'background: #d1fae5; color: #047857;'
      case 'declined':
        return 'background: #fee2e2; color: #dc2626;'
      default:
        return 'background: #dbeafe; color: #1d4ed8;'
    }
  }}
`

const CancelBtn = styled.button`
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  background: transparent;
  color: #ef4444;
  border: 1px solid #ef4444;
  font-family: var(--sans);
  cursor: pointer;
  margin-top: 8px;

  &:hover {
    background: #fee2e2;
  }
`

const CalendarContainer = styled.div`
  flex: 1;
  padding: 20px;
  overflow: hidden;
  
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
    
    &:hover {
      background: var(--accent-bg);
      box-shadow: var(--shadow);
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
  
  .fc-event-my-booking {
    background: #8b5cf6;
    border-color: #8b5cf6;
  }
  
  .fc-event-pending {
    background: #f59e0b;
    border-color: #d97706;
    border-style: dashed;
    border-width: 2px;
  }
  
  .fc-event-confirmed {
    background: #10b981;
    border-color: #059669;
  }
  
  .fc-event-unavailable {
    background: #9ca3af;
    border-color: #9ca3af;
    cursor: default;
    opacity: 0.6;
    pointer-events: none;
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 1rem;
  font-family: var(--sans);
  cursor: pointer;
  transition: box-shadow 0.2s;
  
  ${({ variant = 'secondary' }) =>
    variant === 'primary'
      ? `
          background: var(--accent);
          color: white;
          border: none;
        `
      : `
          background: var(--bg);
          color: var(--text);
          border: 1px solid var(--border);
        `
  }
  
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

const EmptyState = styled.div`
  text-align: center;
  padding: 32px;
  color: var(--text);
`

const FilterSelect = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 14px;
  font-family: var(--sans);
  background: var(--bg);
  color: var(--text);
  margin-bottom: 12px;
`

// Helper to get dates for current week based on day of week
function getNextDateForDay(dayOfWeek: DayOfWeek, baseDate: Date): Date {
  const dayMap: Record<DayOfWeek, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  }
  
  const targetDay = dayMap[dayOfWeek]
  const currentDay = baseDate.getDay()
  let daysUntil = targetDay - currentDay
  
  if (daysUntil < 0) daysUntil += 7
  
  const result = new Date(baseDate)
  result.setDate(result.getDate() + daysUntil)
  return result
}

// Generate availability slots for a date range from recurring weekly schedule
function generateAvailabilitySlots(
  slots: AvailabilitySlot[],
  startDate: Date,
  endDate: Date
): { start: Date; end: Date; slotId: string }[] {
  const result: { start: Date; end: Date; slotId: string }[] = []
  
  const current = new Date(startDate)
  current.setHours(0, 0, 0, 0)
  
  while (current <= endDate) {
    for (const slot of slots) {
      const slotDate = getNextDateForDay(slot.dayOfWeek, current)
      
      if (slotDate >= startDate && slotDate <= endDate) {
        const [startHour, startMin] = slot.startTime.split(':').map(Number)
        const [endHour, endMin] = slot.endTime.split(':').map(Number)
        
        const eventStart = new Date(slotDate)
        eventStart.setHours(startHour, startMin, 0, 0)
        
        const eventEnd = new Date(slotDate)
        eventEnd.setHours(endHour, endMin, 0, 0)
        
        // Only add future slots
        if (eventStart > new Date()) {
          result.push({
            start: eventStart,
            end: eventEnd,
            slotId: `${slot.id}-${slotDate.toISOString().split('T')[0]}`,
          })
        }
      }
    }
    
    current.setDate(current.getDate() + 7)
  }
  
  return result
}

// Check if a time range overlaps with any booking
function isTimeSlotBooked(
  slotStart: Date,
  slotEnd: Date,
  bookings: BookingRequest[]
): boolean {
  return bookings.some(booking => {
    if (booking.status === 'declined') return false
    const bookingStart = new Date(booking.startTime)
    const bookingEnd = new Date(booking.endTime)
    // Check for overlap
    return slotStart < bookingEnd && slotEnd > bookingStart
  })
}

export function ClientPortal() {
  const { user, logout } = useAuth0()
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null)
  const [tutorAvailability, setTutorAvailability] = useState<AvailabilitySlot[]>([])
  const [myRequests, setMyRequests] = useState<BookingRequest[]>([])
  const [activeTab, setActiveTab] = useState<'requests' | 'confirmed'>('requests')
  const [filterTutorId, setFilterTutorId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visibleRange, setVisibleRange] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })
  
  // Booking modal state
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [bookingStart, setBookingStart] = useState<Date | null>(null)
  const [bookingEnd, setBookingEnd] = useState<Date | null>(null)
  const [bookingTitle, setBookingTitle] = useState('')
  const [bookingMessage, setBookingMessage] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)

  // Load tutors on mount
  useEffect(() => {
    loadTutors()
    loadMyData()
  }, [])

  // Load tutor availability when selected tutor changes
  useEffect(() => {
    if (selectedTutor) {
      loadTutorAvailability(selectedTutor.id)
    } else {
      setTutorAvailability([])
    }
  }, [selectedTutor])

  // Reload filtered data when filter changes
  useEffect(() => {
    loadMyData()
  }, [filterTutorId])

  async function loadTutors() {
    try {
      const data = await getAllTutors()
      setTutors(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tutors')
    }
  }

  async function loadTutorAvailability(tutorId: string) {
    try {
      const availability = await getPublicTutorAvailability(tutorId)
      setTutorAvailability(availability)
      // Note: We don't load other clients' bookings - privacy is enforced server-side
      // The server should only return this client's requests for the tutor
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load availability')
    }
  }

  async function loadMyData() {
    try {
      setLoading(true)
      const requests = await getClientBookingRequests(filterTutorId || undefined)
      setMyRequests(requests)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } })
  }

  // Generate available time slots from tutor's weekly availability
  const availableSlots = selectedTutor
    ? generateAvailabilitySlots(tutorAvailability, visibleRange.start, visibleRange.end)
    : []

  // Get my requests for the selected tutor
  const myTutorRequests = selectedTutor
    ? myRequests.filter(r => r.tutorId === selectedTutor.id)
    : []

  // Calendar events - STRICT PRIVACY: only show available slots + my own requests
  const events: EventInput[] = [
    // Available slots (from tutor's weekly availability)
    ...availableSlots
      .filter(slot => !isTimeSlotBooked(slot.start, slot.end, myTutorRequests))
      .map(slot => ({
        id: `available-${slot.slotId}`,
        title: 'Available',
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
        classNames: ['fc-event-available'],
        extendedProps: { type: 'available', slot },
      })),
    // My pending requests (orange, dashed)
    ...myTutorRequests
      .filter(req => req.status === 'pending')
      .map(req => ({
        id: `pending-${req.id}`,
        title: `⏳ ${req.title} (Pending)`,
        start: req.startTime,
        end: req.endTime,
        classNames: ['fc-event-pending'],
        extendedProps: { type: 'my-pending', request: req },
      })),
    // My confirmed bookings (green)
    ...myTutorRequests
      .filter(req => req.status === 'accepted')
      .map(req => ({
        id: `confirmed-${req.id}`,
        title: `✓ ${req.title} (Confirmed)`,
        start: req.startTime,
        end: req.endTime,
        classNames: ['fc-event-confirmed'],
        extendedProps: { type: 'my-confirmed', request: req },
      })),
  ]

  // Handle date selection for booking
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (!selectedTutor) {
      setError('Please select a tutor first')
      return
    }
    
    setBookingStart(selectInfo.start)
    setBookingEnd(selectInfo.end)
    setBookingTitle('')
    setBookingMessage('')
    setBookingError(null)
    setBookingModalOpen(true)
    
    selectInfo.view.calendar.unselect()
  }

  // Handle event click
  const handleEventClick = (clickInfo: EventClickArg) => {
    const { type, slot } = clickInfo.event.extendedProps
    
    if (type === 'available' && selectedTutor && slot) {
      // Click on available slot - open booking modal
      setBookingStart(slot.start)
      setBookingEnd(slot.end)
      setBookingTitle('')
      setBookingMessage('')
      setBookingError(null)
      setBookingModalOpen(true)
    }
    // Clicking on own pending/confirmed requests does nothing for now
  }

  const handleDatesSet = (dateInfo: { start: Date; end: Date }) => {
    setVisibleRange({ start: dateInfo.start, end: dateInfo.end })
  }

  // Submit booking request
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTutor || !bookingStart || !bookingEnd) return

    setBookingLoading(true)
    setBookingError(null)

    try {
      await createBookingRequest({
        tutorId: selectedTutor.id,
        startTime: bookingStart.toISOString(),
        endTime: bookingEnd.toISOString(),
        title: bookingTitle,
        message: bookingMessage || undefined,
      })
      setBookingModalOpen(false)
      loadMyData()
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Failed to submit booking request')
    } finally {
      setBookingLoading(false)
    }
  }

  // Cancel booking request
  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this request?')) return

    try {
      await cancelBookingRequest(requestId)
      loadMyData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel request')
    }
  }

  function formatDateTimeLocal(date: Date): string {
    const offset = date.getTimezoneOffset()
    const localDate = new Date(date.getTime() - offset * 60 * 1000)
    return localDate.toISOString().slice(0, 16)
  }

  function formatDateTime(isoString: string): string {
    return new Date(isoString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function getInitials(name?: string, email?: string): string {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email?.slice(0, 2).toUpperCase() || '??'
  }

  return (
    <Container>
      <Header>
        <Logo>Client Portal</Logo>
        <UserSection>
          <UserEmail>{user?.email}</UserEmail>
          <LogoutBtn onClick={handleLogout}>Log out</LogoutBtn>
        </UserSection>
      </Header>

      <MainContent>
        <Sidebar>
          <SidebarSection>
            <SectionTitle>Browse Tutors</SectionTitle>
            <TutorList>
              {tutors.length === 0 ? (
                <EmptyState>No tutors available</EmptyState>
              ) : (
                tutors.map(tutor => (
                  <TutorItem
                    key={tutor.id}
                    selected={selectedTutor?.id === tutor.id}
                    onClick={() => setSelectedTutor(tutor)}
                  >
                    <TutorAvatar>{getInitials(tutor.name, tutor.email)}</TutorAvatar>
                    <TutorInfo>
                      <TutorName>{tutor.name || 'Unnamed Tutor'}</TutorName>
                      <TutorEmail>{tutor.email}</TutorEmail>
                    </TutorInfo>
                  </TutorItem>
                ))
              )}
            </TutorList>
          </SidebarSection>

          <TabContainer>
            <Tab active={activeTab === 'requests'} onClick={() => setActiveTab('requests')}>
              Pending
            </Tab>
            <Tab active={activeTab === 'confirmed'} onClick={() => setActiveTab('confirmed')}>
              Confirmed
            </Tab>
          </TabContainer>

          <SidebarSection style={{ padding: '12px 16px 0' }}>
            <FilterSelect
              value={filterTutorId}
              onChange={(e) => setFilterTutorId(e.target.value)}
            >
              <option value="">All Tutors</option>
              {tutors.map(tutor => (
                <option key={tutor.id} value={tutor.id}>
                  {tutor.name || tutor.email}
                </option>
              ))}
            </FilterSelect>
          </SidebarSection>

          <RequestsList>
            {loading ? (
              <EmptyState>Loading...</EmptyState>
            ) : activeTab === 'requests' ? (
              myRequests.length === 0 ? (
                <EmptyState>No booking requests</EmptyState>
              ) : (
                myRequests.map(request => (
                  <RequestCard key={request.id} status={request.status}>
                    <RequestTitle>{request.title}</RequestTitle>
                    <RequestMeta>
                      {request.tutor?.name || request.tutor?.email}
                      <br />
                      {formatDateTime(request.startTime)} - {formatDateTime(request.endTime)}
                    </RequestMeta>
                    <RequestStatus status={request.status}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </RequestStatus>
                    {request.status === 'pending' && (
                      <CancelBtn onClick={() => handleCancelRequest(request.id)}>
                        Cancel
                      </CancelBtn>
                    )}
                  </RequestCard>
                ))
              )
            ) : (
              myRequests.filter(r => r.status === 'accepted').length === 0 ? (
                <EmptyState>No confirmed bookings</EmptyState>
              ) : (
                myRequests.filter(r => r.status === 'accepted').map(request => (
                  <RequestCard key={request.id} status="accepted">
                    <RequestTitle>{request.title}</RequestTitle>
                    <RequestMeta>
                      {request.tutor?.name || request.tutor?.email}
                      <br />
                      {formatDateTime(request.startTime)} - {formatDateTime(request.endTime)}
                    </RequestMeta>
                    <RequestStatus status="accepted">Confirmed</RequestStatus>
                  </RequestCard>
                ))
              )
            )}
          </RequestsList>
        </Sidebar>

        <CalendarContainer>
          {error && (
            <ErrorMessage>
              {error}
              <button onClick={() => setError(null)} style={{ marginLeft: '12px', cursor: 'pointer' }}>
                Dismiss
              </button>
            </ErrorMessage>
          )}
          
          {!selectedTutor ? (
            <EmptyState style={{ marginTop: '100px' }}>
              <h3>Select a tutor to view their availability</h3>
              <p>Choose a tutor from the list on the left to see their calendar and request a booking.</p>
            </EmptyState>
          ) : (
            <FullCalendar
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
              select={handleDateSelect}
              eventClick={handleEventClick}
              datesSet={handleDatesSet}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              allDaySlot={false}
              nowIndicator={true}
              height="100%"
            />
          )}
        </CalendarContainer>
      </MainContent>

      {/* Booking Request Modal */}
      {bookingModalOpen && (
        <Modal onClick={() => setBookingModalOpen(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Request Booking with {selectedTutor?.name || selectedTutor?.email}</ModalTitle>
            
            {bookingError && <ErrorMessage>{bookingError}</ErrorMessage>}
            
            <form onSubmit={handleSubmitBooking}>
              <FormGroup>
                <Label htmlFor="title">Session Title *</Label>
                <Input
                  id="title"
                  type="text"
                  value={bookingTitle}
                  onChange={(e) => setBookingTitle(e.target.value)}
                  placeholder="e.g., Math Tutoring Session"
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={bookingStart ? formatDateTimeLocal(bookingStart) : ''}
                  onChange={(e) => setBookingStart(new Date(e.target.value))}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={bookingEnd ? formatDateTimeLocal(bookingEnd) : ''}
                  onChange={(e) => setBookingEnd(new Date(e.target.value))}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="message">Message (optional)</Label>
                <TextArea
                  id="message"
                  value={bookingMessage}
                  onChange={(e) => setBookingMessage(e.target.value)}
                  placeholder="Tell the tutor what you'd like to learn..."
                />
              </FormGroup>
              
              <ButtonGroup>
                <Button type="button" onClick={() => setBookingModalOpen(false)} disabled={bookingLoading}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={bookingLoading}>
                  {bookingLoading ? 'Sending...' : 'Send Request'}
                </Button>
              </ButtonGroup>
            </form>
          </ModalContent>
        </Modal>
      )}
    </Container>
  )
}
