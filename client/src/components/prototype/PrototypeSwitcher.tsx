import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface PrototypeSwitcherProps {
  variants: readonly { key: string; name: string }[];
  current: string;
}

export function PrototypeSwitcher({
  variants,
  current,
}: PrototypeSwitcherProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentIndex = Math.max(
    variants.findIndex((variant) => variant.key === current),
    0,
  );

  const selectOffset = (offset: number) => {
    const next =
      variants[(currentIndex + offset + variants.length) % variants.length];
    const params = new URLSearchParams(searchParams);
    params.set('variant', next.key);
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.matches('input, textarea, select, button, [contenteditable]')
      ) {
        return;
      }
      if (event.key === 'ArrowLeft') selectOffset(-1);
      if (event.key === 'ArrowRight') selectOffset(1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (import.meta.env.PROD) return null;

  const active = variants[currentIndex];
  return (
    <div
      className='prototype-switcher'
      role='group'
      aria-label='Prototype variant'
    >
      <button
        type='button'
        onClick={() => selectOffset(-1)}
        aria-label='Previous variant'
      >
        <ArrowLeft size={16} />
      </button>
      <span>
        {active.key} — {active.name}
      </span>
      <button
        type='button'
        onClick={() => selectOffset(1)}
        aria-label='Next variant'
      >
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
