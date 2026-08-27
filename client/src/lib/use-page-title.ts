import { useEffect } from 'react';

export function usePageTitle(pageName: string) {
  useEffect(() => {
    document.title = `${pageName} | Booking Service`;
  }, [pageName]);
}
