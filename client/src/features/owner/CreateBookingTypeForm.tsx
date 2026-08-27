import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  createBookingTypeSchema,
  type CreateBookingTypeFormData,
} from '@/features/owner/schemas';
import { useCreateOwnerBookingTypeMutation } from '@/features/owner/queries';

export function CreateBookingTypeForm() {
  const [successMessage, setSuccessMessage] = useState('');

  const mutation = useCreateOwnerBookingTypeMutation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateBookingTypeFormData>({
    resolver: zodResolver(createBookingTypeSchema),
    defaultValues: {
      title: '',
      description: '',
      durationMinutes: 30,
    },
  });

  const onSubmit = async (data: CreateBookingTypeFormData) => {
    setSuccessMessage(null);

    try {
      await mutation.mutateAsync(data);
      setSuccessMessage('Booking type created');
      reset();
    } catch {
      // Mutation state renders the recoverable error while preserving the form.
    }
  };

  return (
    <div>
      <header className='border-b border-white/10 pb-5'>
        <p className='text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200/70'>
          Create booking type
        </p>
        <h2 className='mt-1 text-xl font-semibold tracking-tight text-white'>
          Create booking type
        </h2>
      </header>
      <form onSubmit={handleSubmit(onSubmit)} className='mt-6 space-y-5'>
        <div className='space-y-2'>
          <label
            htmlFor='title'
            className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
          >
            Title
          </label>
          <input
            id='title'
            type='text'
            aria-describedby='title-guidance'
            className='flex h-10 w-full rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-white/5 disabled:opacity-50'
            {...register('title')}
            disabled={isSubmitting || mutation.isPending}
          />
          <p id='title-guidance' className='text-xs text-slate-500'>
            3–100 characters
          </p>
          {errors.title && (
            <p className='text-xs text-destructive'>{errors.title.message}</p>
          )}
        </div>

        <div className='space-y-2'>
          <label
            htmlFor='description'
            className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
          >
            Description
          </label>
          <textarea
            id='description'
            aria-describedby='description-guidance'
            rows={4}
            className='flex min-h-28 w-full resize-none rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-white/5 disabled:opacity-50'
            {...register('description')}
            disabled={isSubmitting || mutation.isPending}
          />
          <p id='description-guidance' className='text-xs text-slate-500'>
            10–500 characters
          </p>
          {errors.description && (
            <p className='text-xs text-destructive'>
              {errors.description.message}
            </p>
          )}
        </div>

        <div className='space-y-2'>
          <label
            htmlFor='duration'
            className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
          >
            Duration
          </label>
          <input
            id='duration'
            type='number'
            aria-describedby='duration-guidance'
            min='15'
            max='480'
            step='1'
            className='flex h-10 w-full rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-white/5 disabled:opacity-50'
            {...register('durationMinutes', { valueAsNumber: true })}
            disabled={isSubmitting || mutation.isPending}
          />
          <p id='duration-guidance' className='text-xs text-slate-500'>
            15–480 whole minutes
          </p>
          {errors.durationMinutes && (
            <p className='text-xs text-destructive'>
              {errors.durationMinutes.message}
            </p>
          )}
        </div>

        {successMessage && (
          <div className='rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200'>
            {successMessage}
          </div>
        )}

        {mutation.isError && (
          <div className='rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200'>
            We couldn’t create the booking type. Try again.
          </div>
        )}

        <Button
          type='submit'
          disabled={isSubmitting || mutation.isPending}
          className='w-full bg-amber-300 text-slate-950 hover:bg-amber-200'
        >
          {mutation.isPending ? 'Loading...' : 'Create booking type'}
        </Button>
      </form>
    </div>
  );
}
