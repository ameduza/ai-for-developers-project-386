import { BriefcaseBusiness, CalendarDays } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';

export function ShellLayout() {
  return (
    <div className='public-shell'>
      <header className='public-header'>
        <div>
          <Link to='/' className='public-brand'>
            <span aria-hidden='true'>
              <CalendarDays />
            </span>
            Booking Service
          </Link>
          <Link to='/owner' className='public-owner-link'>
            <BriefcaseBusiness aria-hidden='true' />
            Owner workspace
          </Link>
        </div>
      </header>
      <main className='public-content'>
        <Outlet />
      </main>
    </div>
  );
}
