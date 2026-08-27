import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { ShellLayout } from '@/app/layouts/ShellLayout';
import { OwnerWorkspaceLayout } from '@/app/layouts/OwnerWorkspaceLayout';
import { HomePage } from '@/pages/HomePage';
import { GuestLandingPage } from '@/pages/guest/GuestLandingPage';
import { GuestBookingTypePage } from '@/pages/guest/GuestBookingTypePage';
import { GuestBookingConfirmationPage } from '@/pages/guest/GuestBookingConfirmationPage';
import { OwnerDashboardPage } from '@/pages/owner/OwnerDashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const appRoutes: RouteObject[] = [
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
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: 'owner',
    element: <OwnerWorkspaceLayout />,
    children: [{ index: true, element: <OwnerDashboardPage /> }],
  },
];

export function createAppRouter() {
  return createBrowserRouter(appRoutes);
}
