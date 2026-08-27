import { useEffect } from 'react';
import { ArrowUpRight, CalendarDays, LayoutGrid } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';

const ownerNavigation = [
  { href: '/owner#booking-types', label: 'Booking types', icon: LayoutGrid },
  { href: '/owner#bookings', label: 'Bookings', icon: CalendarDays },
];

export function OwnerWorkspaceLayout() {
  useEffect(() => {
    const previousTitle = document.title;
    document.documentElement.classList.add('dark');
    document.title = 'Owner workspace | Booking Service';

    return () => {
      document.documentElement.classList.remove('dark');
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className='min-h-screen bg-slate-950 text-slate-100'>
      <aside
        aria-label='Owner workspace'
        className='fixed inset-y-0 left-0 z-20 flex w-16 flex-col items-center border-r border-white/10 bg-slate-950 py-4'
      >
        <Link
          to='/owner'
          aria-label='Booking Service'
          className='grid size-9 place-items-center rounded-xl bg-amber-300 text-sm font-black text-slate-950'
        >
          BS
        </Link>

        <nav
          className='mt-7 flex flex-col gap-2'
          aria-label='Workspace navigation'
        >
          {ownerNavigation.map(({ href, label, icon: Icon }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              className='grid size-9 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white'
            >
              <Icon aria-hidden='true' className='size-4' />
            </a>
          ))}
        </nav>
      </aside>

      <div className='pl-16'>
        <header className='flex h-14 items-center justify-between border-b border-white/10 px-6'>
          <p className='text-sm font-semibold text-slate-200'>Booking studio</p>
          <Link
            to='/guest'
            className='inline-flex items-center gap-2 text-xs font-medium text-slate-400 transition-colors hover:text-white'
          >
            View booking page
            <ArrowUpRight aria-hidden='true' className='size-3.5' />
          </Link>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
