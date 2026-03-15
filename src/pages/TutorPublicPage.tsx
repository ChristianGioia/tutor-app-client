import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import type { EventInput, EventClickArg } from '@fullcalendar/core'
import styled from '@emotion/styled'
import { getPublicTutorAppointments, type Appointment } from '../api/client'

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

const BackLink = styled(Link)`
  font-size: 14px;
  padding: 6px 16px;
  border-radius: 6px;
  color: var(--accent);
  background: var(--accent-bg);
  border: 2px solid var(--accent-border);
  font-family: var(--sans);
  text-decoration: none;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: var(--shadow);
  }
`

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

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

const LoadingContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  color: var(--text);
`

const ErrorContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 32px;
  text-align: center;
`

const ErrorMessage = styled.div`
  background: #fef2f2;
  color: #dc2626;
  padding: 16px 24px;
  border-radius: 8px;
  font-size: 1rem;
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
  margin: 0 0 16px;
  font-size: 1.25rem;
  color: var(--text-h);
`

const ModalDetail = styled.div`
  margin-bottom: 12px;
  
  strong {
    display: block;
    font-size: 0.875rem;
    color: var(--text);
    margin-bottom: 4px;
  }
  
  span {
    color: var(--text-h);
  }
`

const StatusBadge = styled.span<{ status: string }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  
  ${({ status }) => {
    switch (status) {
      case 'available':
        return 'background: #dbeafe; color: #1d4ed8;'
      case 'booked':
        return 'background: #d1fae5; color: #047857;'
      case 'completed':
        return 'background: #e5e7eb; color: #374151;'
      default:
        return 'background: #e5e7eb; color: #374151;'
    }
  }}
`

const CloseButton = styled.button`
  width: 100%;
  margin-top: 20px;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 1rem;
  font-family: var(--sans);
  cursor: pointer;
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  transition: box-shadow 0.2s;
  
  &:hover {
    box-shadow: var(--shadow);
  }
`

export function TutorPublicPage() {
  const { tutorId } = useParams<{ tutorId: string }>()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [tutorName, setTutorName] = useState<string>('')

  useEffect(() => {
    if (tutorId) {
      fetchAppointments()
    }
  }, [tutorId])

  async function fetchAppointments() {
    if (!tutorId) return
    
    try {
      setLoading(true)
      const data = await getPublicTutorAppointments(tutorId)
      setAppointments(data)
      
      // Get tutor name from the first appointment
      if (data.length > 0 && data[0].tutor) {
        setTutorName(data[0].tutor.name || data[0].tutor.email)
      }
      
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch appointments')
    } finally {
      setLoading(false)
    }
  }

  // Convert appointments to FullCalendar events (only show available appointments publicly)
  const events: EventInput[] = appointments
    .filter(apt => apt.status !== 'cancelled')
    .map((apt) => ({
      id: apt.id,
      title: apt.status === 'available' ? apt.title : 'Booked',
      start: apt.startTime,
      end: apt.endTime,
      extendedProps: {
        description: apt.description,
        status: apt.status,
      },
      classNames: [`fc-event-${apt.status}`],
    }))

  const handleEventClick = (clickInfo: EventClickArg) => {
    const apt = appointments.find((a) => a.id === clickInfo.event.id)
    if (apt) {
      setSelectedAppointment(apt)
    }
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

  if (!tutorId) {
    return (
      <Container>
        <Header>
          <Logo>Tutor Calendar</Logo>
          <BackLink to="/">Back to Home</BackLink>
        </Header>
        <ErrorContainer>
          <ErrorMessage>No tutor ID provided</ErrorMessage>
          <BackLink to="/">Go to Home</BackLink>
        </ErrorContainer>
      </Container>
    )
  }

  return (
    <Container>
      <Header>
        <Logo>{tutorName ? `${tutorName}'s Calendar` : 'Tutor Calendar'}</Logo>
        <BackLink to="/">Back to Home</BackLink>
      </Header>

      <Main>
        {loading ? (
          <LoadingContainer>Loading calendar...</LoadingContainer>
        ) : error ? (
          <ErrorContainer>
            <ErrorMessage>{error}</ErrorMessage>
            <BackLink to="/">Go to Home</BackLink>
          </ErrorContainer>
        ) : (
          <CalendarWrapper>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              events={events}
              eventClick={handleEventClick}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              allDaySlot={false}
              nowIndicator={true}
              height="100%"
            />
          </CalendarWrapper>
        )}
      </Main>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <Modal onClick={() => setSelectedAppointment(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{selectedAppointment.title}</ModalTitle>
            
            <ModalDetail>
              <strong>Status</strong>
              <StatusBadge status={selectedAppointment.status}>
                {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
              </StatusBadge>
            </ModalDetail>
            
            <ModalDetail>
              <strong>Start Time</strong>
              <span>{formatDateTime(selectedAppointment.startTime)}</span>
            </ModalDetail>
            
            <ModalDetail>
              <strong>End Time</strong>
              <span>{formatDateTime(selectedAppointment.endTime)}</span>
            </ModalDetail>
            
            {selectedAppointment.description && (
              <ModalDetail>
                <strong>Description</strong>
                <span>{selectedAppointment.description}</span>
              </ModalDetail>
            )}
            
            <CloseButton onClick={() => setSelectedAppointment(null)}>
              Close
            </CloseButton>
          </ModalContent>
        </Modal>
      )}
    </Container>
  )
}
