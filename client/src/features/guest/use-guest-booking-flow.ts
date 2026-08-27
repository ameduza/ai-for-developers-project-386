import { useMemo, useState } from 'react';
import type { TimeSlot } from '@/lib/api/generated';
import type { GuestDetails } from '@/features/guest/BookingForm';
import {
  isWithinBookingWindow,
  utcDateKey,
  utcMonthKey,
} from '@/features/guest/calendar';
import {
  useGuestBookingTypesQuery,
  useGuestTimeSlotsQuery,
} from '@/features/guest/queries';

export function useGuestBookingFlow(bookingTypeId: string | undefined) {
  const bookingTypesQuery = useGuestBookingTypesQuery();
  const timeSlotsQuery = useGuestTimeSlotsQuery(bookingTypeId);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState<string | null>(null);
  const [step, setStep] = useState<'time' | 'details'>('time');
  const [guestDetails, setGuestDetails] = useState<GuestDetails>({
    name: '',
    email: '',
  });
  const [timeConflict, setTimeConflict] = useState(false);
  const [rejectedSlotIds, setRejectedSlotIds] = useState<Set<string>>(
    new Set(),
  );
  const now = Date.now();
  const bookingType = bookingTypesQuery.data?.items.find(
    (candidate) => candidate.id === bookingTypeId,
  );
  const availableTimeSlots = useMemo(
    () =>
      (timeSlotsQuery.data?.items ?? [])
        .filter(
          (slot) =>
            slot.available &&
            !rejectedSlotIds.has(slot.id) &&
            isWithinBookingWindow(slot, now),
        )
        .sort((first, second) =>
          first.startTime.localeCompare(second.startTime),
        ),
    [now, rejectedSlotIds, timeSlotsQuery.data?.items],
  );
  const slotsByDate = useMemo(() => {
    const grouped = new Map<string, TimeSlot[]>();
    for (const slot of availableTimeSlots) {
      const key = utcDateKey(slot.startTime);
      grouped.set(key, [...(grouped.get(key) ?? []), slot]);
    }
    return grouped;
  }, [availableTimeSlots]);
  const firstAvailableDate = slotsByDate.keys().next().value as
    string | undefined;
  const activeDate = selectedDate ?? firstAvailableDate ?? null;
  const activeMonth =
    visibleMonth ??
    (activeDate ? utcMonthKey(activeDate) : utcDateKey(new Date()).slice(0, 7));
  const selectedTimeSlot =
    availableTimeSlots.find((slot) => slot.id === selectedSlotId) ?? null;
  const activeDateSlots = activeDate ? (slotsByDate.get(activeDate) ?? []) : [];

  const rejectTimeSlot = (details: GuestDetails) => {
    if (!selectedTimeSlot) return;
    setGuestDetails(details);
    setRejectedSlotIds((ids) => new Set(ids).add(selectedTimeSlot.id));
    setSelectedSlotId(null);
    setTimeConflict(true);
    setStep('time');
    void timeSlotsQuery.refetch();
  };

  return {
    bookingTypesQuery,
    timeSlotsQuery,
    bookingType,
    selectedDate,
    setSelectedDate,
    selectedSlotId,
    setSelectedSlotId,
    visibleMonth,
    setVisibleMonth,
    step,
    setStep,
    guestDetails,
    timeConflict,
    setTimeConflict,
    availableTimeSlots,
    slotsByDate,
    activeDate,
    activeMonth,
    selectedTimeSlot,
    activeDateSlots,
    rejectTimeSlot,
  };
}
