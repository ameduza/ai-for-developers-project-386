import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export type PrototypeVariant = {
  key: string;
  name: string;
};

type PrototypeSwitcherProps = {
  variants: PrototypeVariant[];
  current: string;
};

export function PrototypeSwitcher({
  variants,
  current,
}: PrototypeSwitcherProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentIndex = Math.max(
    variants.findIndex((variant) => variant.key === current),
    0,
  );

  const selectVariant = (index: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('variant', variants[index].key);
    setSearchParams(next, { replace: true });
  };

  const cycle = (direction: -1 | 1) => {
    const nextIndex =
      (currentIndex + direction + variants.length) % variants.length;
    selectVariant(nextIndex);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.matches('input, textarea, select, [contenteditable="true"]')
      ) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        cycle(-1);
      }

      if (event.key === 'ArrowRight') {
        cycle(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (import.meta.env.PROD) {
    return null;
  }

  const active = variants[currentIndex];

  return (
    <nav className='prototype-switcher' aria-label='Prototype variants'>
      <button
        type='button'
        onClick={() => cycle(-1)}
        aria-label='Previous variant'
      >
        ←
      </button>
      <span>
        <strong>{active.key}</strong> — {active.name}
      </span>
      <button type='button' onClick={() => cycle(1)} aria-label='Next variant'>
        →
      </button>
    </nav>
  );
}
