import { createBrowserRouter } from 'react-router-dom';
import { ShellLayout } from '@/app/layouts/ShellLayout';
import { HomePage } from '@/pages/HomePage';
import { GuestLandingPage } from '@/pages/guest/GuestLandingPage';
import { GuestBookingTypePage } from '@/pages/guest/GuestBookingTypePage';
import { GuestBookingConfirmationPage } from '@/pages/guest/GuestBookingConfirmationPage';
import { OwnerWorkspacePrototypePage } from '@/pages/owner/OwnerWorkspacePrototypePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <ShellLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'guest', element: <GuestLandingPage /> },
      {
        path: 'guest/booking-types/:bookingTypeId',
        element: <GuestBookingTypePage />,
      },
      {
        path: 'bookings/:bookingId',
        element: <GuestBookingConfirmationPage />,
      },
      { path: 'owner', element: <OwnerWorkspacePrototypePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
