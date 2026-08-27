import type { Owner } from '@/lib/api/generated';

interface OwnerProfileProps {
  owner: Owner | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function OwnerProfile({
  owner,
  isLoading,
  isError,
  onRetry,
}: OwnerProfileProps) {
  if (isLoading) {
    return <p className='text-sm text-slate-400'>Loading...</p>;
  }

  if (isError || !owner) {
    return (
      <div className='flex min-h-14 items-center justify-between gap-4'>
        <p className='text-sm text-rose-300'>
          We couldn’t load the Owner information. Try again.
        </p>
        <button
          type='button'
          onClick={onRetry}
          className='rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/5'
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <header className='min-h-14'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight text-white'>
          {owner.name}
        </h1>
        <p className='mt-1 text-sm text-slate-400'>{owner.bio}</p>
      </div>
    </header>
  );
}
