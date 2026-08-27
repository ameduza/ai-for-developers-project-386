import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@/lib/api/generated';
import type { TimeSlot } from '@/lib/api/generated';
import {
  createBookingSchema,
  type CreateBookingFormData,
} from '@/features/guest/schemas';
import { useCreateBookingMutation } from '@/features/guest/queries';

export type GuestDetails = {
  name: string;
  email: string;
};

type BookingFormProps = {
  bookingTypeId: string;
  timeSlot: TimeSlot;
  initialGuestDetails?: GuestDetails;
  onTimeUnavailable?: (guestDetails: GuestDetails) => void;
};

export function BookingForm({
  bookingTypeId,
  timeSlot,
  initialGuestDetails,
  onTimeUnavailable,
}: BookingFormProps) {
  const navigate = useNavigate();
  const mutation = useCreateBookingMutation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateBookingFormData>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      bookingTypeId,
      slotStart: timeSlot.startTime,
      slotEnd: timeSlot.endTime,
      guestName: initialGuestDetails?.name ?? '',
      guestEmail: initialGuestDetails?.email ?? '',
    },
  });

  const onSubmit = async (data: CreateBookingFormData) => {
    try {
      const booking = await mutation.mutateAsync({
        bookingTypeId: data.bookingTypeId,
        timeSlotStart: data.slotStart,
        timeSlotEnd: data.slotEnd,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
      });
      navigate(`/bookings/${booking.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        if (onTimeUnavailable) {
          onTimeUnavailable({
            name: data.guestName,
            email: data.guestEmail,
          });
          return;
        }

        setError('root.slotTaken', {
          type: 'server',
          message: 'This time is no longer available. Choose another time.',
        });
        return;
      }

      setError('root.serverError', {
        type: 'server',
        message: 'We couldn’t confirm your booking. Try again.',
      });
    }
  };
  const pending = isSubmitting || mutation.isPending;

  return (
    <form
      className='guest-details-form'
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <div>
        <label htmlFor='guestName'>Name</label>
        <input
          id='guestName'
          type='text'
          autoComplete='name'
          {...register('guestName')}
          disabled={pending}
          aria-invalid={Boolean(errors.guestName)}
        />
        {errors.guestName && <p>{errors.guestName.message}</p>}
      </div>

      <div>
        <label htmlFor='guestEmail'>Email</label>
        <input
          id='guestEmail'
          type='email'
          autoComplete='email'
          {...register('guestEmail')}
          disabled={pending}
          aria-invalid={Boolean(errors.guestEmail)}
        />
        {errors.guestEmail && <p>{errors.guestEmail.message}</p>}
      </div>

      {errors.root?.slotTaken && (
        <p role='alert' className='guest-form-error'>
          {errors.root.slotTaken.message}
        </p>
      )}
      {errors.root?.serverError && (
        <p role='alert' className='guest-form-error'>
          {errors.root.serverError.message}
        </p>
      )}

      <button className='guest-primary-action' type='submit' disabled={pending}>
        {pending ? 'Loading...' : 'Confirm booking'}
      </button>
    </form>
  );
}
