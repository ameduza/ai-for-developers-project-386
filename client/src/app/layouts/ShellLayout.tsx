import { Link, NavLink, Outlet } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'text-sm font-medium transition-colors hover:text-foreground',
    isActive ? 'text-foreground' : 'text-muted-foreground',
  ].join(' ');

export function ShellLayout() {
  return (
    <div className='min-h-screen bg-background text-foreground'>
      <header className='border-b'>
        <div className='container flex items-center justify-between gap-4 py-4'>
          <div className='space-y-1'>
            <Link to='/' className='text-lg font-semibold tracking-tight'>
              Booking Service
            </Link>
            <p className='text-sm text-muted-foreground'>
              TypeScript + Vite client scaffold
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant='secondary'>TanStack Query</Badge>
            <Badge variant='secondary'>shadcn/ui</Badge>
          </div>
        </div>
        <Separator />
        <div className='container flex flex-wrap gap-4 py-3'>
          <NavLink to='/' className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to='/guest' className={navLinkClass}>
            Guest area
          </NavLink>
          <NavLink to='/owner' className={navLinkClass}>
            Owner area
          </NavLink>
        </div>
      </header>

      <main className='container py-8'>
        <Outlet />
      </main>
    </div>
  );
}
