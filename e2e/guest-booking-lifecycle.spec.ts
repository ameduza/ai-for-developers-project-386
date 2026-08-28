import { randomUUID } from 'node:crypto';
import {
  expect,
  test,
  type APIRequestContext,
  type TestInfo,
} from '@playwright/test';
import type {
  BookingType,
  CreateBookingType,
} from '../client/src/lib/api/generated/index.js';
import { createUniqueE2EId } from './support/unique-id.js';

function createUniqueJourneyData(testInfo: TestInfo) {
  const uniqueId = createUniqueE2EId(testInfo);

  return {
    bookingType: {
      title: `E2E Guest Booking Type ${uniqueId}`,
      description: `Created for the Guest booking journey ${uniqueId}.`,
      durationMinutes: 30,
    },
    guest: {
      name: `E2E Guest ${uniqueId}`,
      email: `e2e-guest-${uniqueId}@example.com`,
    },
    slotChoiceSeed: Number.parseInt(randomUUID().slice(0, 8), 16),
  } as const;
}

async function createBookingType(
  request: APIRequestContext,
  bookingType: CreateBookingType,
) {
  const response = await request.post(
    'http://localhost:3100/owner/booking-types',
    { data: bookingType },
  );

  expect(response.ok()).toBe(true);
  return (await response.json()) as BookingType;
}

test('Guest can book, review, and cancel an available Time Slot', async ({
  page,
  request,
}, testInfo) => {
  const journey = createUniqueJourneyData(testInfo);
  const bookingType = await createBookingType(request, journey.bookingType);

  await page.goto(`/guest/booking-types/${bookingType.id}`);
  await expect(
    page.getByRole('heading', { name: bookingType.title, exact: true }),
  ).toBeVisible();

  const availableTimes = page.getByRole('region', {
    name: 'Available times',
  });
  const timeButtons = availableTimes.getByRole('button');
  const availableTimeCount = await timeButtons.count();
  expect(availableTimeCount).toBeGreaterThan(0);

  const selectedTimeButton = timeButtons.nth(
    journey.slotChoiceSeed % availableTimeCount,
  );
  const selectedTime = (await selectedTimeButton.innerText()).trim();
  await selectedTimeButton.click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await page.getByLabel('Name', { exact: true }).fill(journey.guest.name);
  await page.getByLabel('Email', { exact: true }).fill(journey.guest.email);
  await page
    .getByRole('button', { name: 'Confirm booking', exact: true })
    .click();

  await expect(
    page.getByRole('heading', { name: 'Booking confirmed', exact: true }),
  ).toBeVisible();
  const confirmationUrl = page.url();
  const confirmationSummary = page
    .getByRole('region', { name: 'Booking confirmed' })
    .locator('dl');
  await expect(
    confirmationSummary.getByText(journey.guest.name, { exact: true }),
  ).toBeVisible();
  await expect(
    confirmationSummary.getByText(journey.guest.email, { exact: true }),
  ).toBeVisible();
  await expect(
    confirmationSummary.getByText(bookingType.title, { exact: true }),
  ).toBeVisible();
  await expect(
    confirmationSummary.getByText(selectedTime, { exact: true }),
  ).toBeVisible();

  await page.goto('/owner');
  const upcomingBooking = page.getByRole('article').filter({
    has: page.getByText(journey.guest.name, { exact: true }),
  });
  await expect(upcomingBooking).toBeVisible();
  await expect(
    upcomingBooking.getByRole('heading', {
      name: bookingType.title,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    upcomingBooking.getByRole('link', {
      name: journey.guest.email,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    upcomingBooking.getByText(selectedTime, { exact: true }),
  ).toBeVisible();

  await page.goto(confirmationUrl);
  await page
    .getByRole('button', { name: 'Cancel booking', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Cancel booking', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Booking canceled', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('This time is now available for someone else.', {
      exact: false,
    }),
  ).toBeVisible();

  await page.goto(`/guest/booking-types/${bookingType.id}`);
  await expect(
    page
      .getByRole('region', { name: 'Available times' })
      .getByRole('button', { name: selectedTime, exact: true }),
  ).toBeVisible();
});
