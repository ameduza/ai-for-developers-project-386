import { createBrowserRouter, Navigate } from "react-router-dom";
import { ShellLayout } from "@/app/layouts/ShellLayout";
import { HomePage } from "@/pages/HomePage";
import { GuestLandingPage } from "@/pages/guest/GuestLandingPage";
import { GuestBookingTypePage } from "@/pages/guest/GuestBookingTypePage";
import { GuestBookingConfirmationPage } from "@/pages/guest/GuestBookingConfirmationPage";
import { OwnerDashboardPage } from "@/pages/owner/OwnerDashboardPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    element: <ShellLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "guest", element: <GuestLandingPage /> },
      { path: "guest/booking-types/:bookingTypeId", element: <GuestBookingTypePage /> },
      { path: "bookings/:bookingId", element: <GuestBookingConfirmationPage /> },
      { path: "owner", element: <OwnerDashboardPage /> },
      { path: "start", element: <Navigate to="/guest" replace /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
