import { ArrowRight, CalendarCheck2, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '@/lib/use-page-title';

export function HomePage() {
  usePageTitle('Home');

  return (
    <section className='public-hero' aria-labelledby='public-hero-title'>
      <div className='public-hero-copy'>
        <p>Simple scheduling, thoughtfully arranged</p>
        <h1 id='public-hero-title'>Find a time that works for you</h1>
        <p>
          Choose a booking type, select an available time, and confirm your
          booking.
        </p>
        <Link className='guest-primary-action' to='/guest'>
          Book time slot <ArrowRight aria-hidden='true' />
        </Link>
      </div>
      <aside className='public-hero-note' aria-label='How booking works'>
        <CalendarCheck2 aria-hidden='true' />
        <p>Available for the next 14 days</p>
        <h2>Your time, clearly presented.</h2>
        <div>
          <Clock3 aria-hidden='true' />
          <span>All times are shown in UTC.</span>
        </div>
      </aside>
    </section>
  );
}
