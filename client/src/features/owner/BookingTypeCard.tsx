import type { BookingType } from '@/lib/api/generated';

interface BookingTypeCardProps {
  bookingType: BookingType;
}

export function BookingTypeCard({ bookingType }: BookingTypeCardProps) {
  return (
    <article className='rounded-xl border border-white/10 bg-white/[0.035] p-4'>
      <div className='flex items-start justify-between gap-3'>
        <h3 className='text-sm font-semibold leading-5 text-slate-100'>
          {bookingType.title}
        </h3>
        <span className='shrink-0 rounded-md bg-white/[0.06] px-2 py-1 text-[11px] font-medium text-slate-400'>
          {bookingType.durationMinutes} min
        </span>
      </div>
      <p className='mt-2 line-clamp-3 text-xs leading-5 text-slate-500'>
        {bookingType.description}
      </p>
    </article>
  );
}
