import { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import {
  getTutorAvailability,
  createAvailability,
  deleteAvailability,
  type AvailabilitySlot,
  type DayOfWeek,
} from '../api/client'

const Container = styled.div`
  padding: 20px;
  max-width: 800px;
`

const Title = styled.h2`
  margin: 0 0 8px 0;
  font-size: 1.25rem;
  font-weight: 600;
`

const Subtitle = styled.p`
  margin: 0 0 24px 0;
  color: var(--text);
  opacity: 0.7;
  font-size: 0.875rem;
`

const DaySection = styled.div`
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
`

const DayHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`

const DayName = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  text-transform: capitalize;
`

const AddButton = styled.button`
  padding: 6px 12px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
`

const SlotList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const SlotItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--accent-bg);
  border-radius: 6px;
`

const SlotTime = styled.span`
  font-size: 0.95rem;
  font-weight: 500;
`

const DeleteButton = styled.button`
  margin-left: auto;
  padding: 4px 8px;
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  
  &:hover {
    background: #fecaca;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const EmptySlot = styled.div`
  color: var(--text);
  opacity: 0.5;
  font-size: 0.875rem;
  font-style: italic;
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
  max-width: 400px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`

const ModalTitle = styled.h3`
  margin: 0 0 20px 0;
  font-size: 1.125rem;
  font-weight: 600;
`

const FormGroup = styled.div`
  margin-bottom: 16px;
`

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-size: 0.875rem;
  font-weight: 500;
`

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 1rem;
  font-family: var(--sans);
  
  &:focus {
    outline: none;
    border-color: var(--accent);
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
`

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--border);
  
  ${({ variant }) => variant === 'primary' ? `
    background: var(--accent);
    color: white;
    border-color: var(--accent);
  ` : `
    background: var(--bg);
    color: var(--text);
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

const LoadingState = styled.div`
  text-align: center;
  padding: 40px;
  color: var(--text);
  opacity: 0.7;
`

const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
]

export function TutorAvailabilityManager() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchAvailability()
  }, [])

  async function fetchAvailability() {
    try {
      setLoading(true)
      const data = await getTutorAvailability()
      setSlots(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch availability')
    } finally {
      setLoading(false)
    }
  }

  function getSlotsByDay(day: DayOfWeek): AvailabilitySlot[] {
    return slots.filter(slot => slot.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  function formatTime(time: string): string {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  function handleAddClick(day: DayOfWeek) {
    setSelectedDay(day)
    setStartTime('09:00')
    setEndTime('17:00')
    setModalOpen(true)
  }

  async function handleSave() {
    if (!selectedDay) return

    setSaving(true)
    setError(null)

    try {
      await createAvailability({
        dayOfWeek: selectedDay,
        startTime,
        endTime,
      })
      await fetchAvailability()
      setModalOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save availability')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this availability slot?')) return

    setDeletingId(id)
    setError(null)

    try {
      await deleteAvailability(id)
      await fetchAvailability()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete availability')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return <LoadingState>Loading availability...</LoadingState>
  }

  return (
    <Container>
      <Title>Weekly Availability</Title>
      <Subtitle>Set your recurring weekly schedule. Clients will be able to request bookings during these times.</Subtitle>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {DAYS_OF_WEEK.map(day => (
        <DaySection key={day}>
          <DayHeader>
            <DayName>{day}</DayName>
            <AddButton onClick={() => handleAddClick(day)}>+ Add Hours</AddButton>
          </DayHeader>
          <SlotList>
            {getSlotsByDay(day).length === 0 ? (
              <EmptySlot>No availability set</EmptySlot>
            ) : (
              getSlotsByDay(day).map(slot => (
                <SlotItem key={slot.id}>
                  <SlotTime>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</SlotTime>
                  <DeleteButton
                    onClick={() => handleDelete(slot.id)}
                    disabled={deletingId === slot.id}
                  >
                    {deletingId === slot.id ? 'Removing...' : 'Remove'}
                  </DeleteButton>
                </SlotItem>
              ))
            )}
          </SlotList>
        </DaySection>
      ))}

      {modalOpen && selectedDay && (
        <Modal onClick={() => setModalOpen(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalTitle>Add Availability for {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}</ModalTitle>
            
            <FormGroup>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
              />
            </FormGroup>
            
            <ButtonGroup>
              <Button onClick={() => setModalOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}
    </Container>
  )
}
