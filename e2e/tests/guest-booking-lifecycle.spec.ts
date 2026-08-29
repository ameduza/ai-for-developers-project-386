import {
  expect,
  test,
  type APIRequestContext,
  type Locator,
  type TestInfo,
} from '@playwright/test';
import type {
  BookingType,
  CreateBookingType,
} from '../../client/src/lib/api/generated/index.js';
import { createUniqueE2EId } from '../support/unique-id.js';

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
  } as const;
}

function displayedTimeSlotStart(displayedTimeSlot: string) {
  const [date, timeRange] = displayedTimeSlot.split(' · ');
  const [startTime] = timeRange.split('–');

  return Date.parse(`${date} ${startTime} UTC`);
}

async function createBookingType(
  request: APIRequestContext,
  bookingType: CreateBookingType,
) {
  const apiBaseUrl = process.env.E2E_API_BASE_URL ?? 'http://localhost:3100';
  const response = await request.post(`${apiBaseUrl}/owner/booking-types`, {
    data: bookingType,
  });

  expect(response.ok()).toBe(true);
  return (await response.json()) as BookingType;
}

async function availableTimesScrollState(
  availableTimes: Locator,
  timeButton: Locator,
) {
  return availableTimes.evaluate(
    (region, button) => {
      const scrollContainer = [
        ...region.querySelectorAll<HTMLElement>('*'),
      ].find((element) => {
        const overflowY = window.getComputedStyle(element).overflowY;
        return overflowY === 'auto' || overflowY === 'scroll';
      });
      const timeButton = button as HTMLElement;

      if (!scrollContainer) return null;

      const containerBounds = scrollContainer.getBoundingClientRect();
      const buttonBounds = timeButton.getBoundingClientRect();

      return {
        clientHeight: scrollContainer.clientHeight,
        scrollHeight: scrollContainer.scrollHeight,
        scrollTop: scrollContainer.scrollTop,
        containerTop: containerBounds.top,
        containerBottom: containerBounds.bottom,
        buttonTop: buttonBounds.top,
        buttonBottom: buttonBounds.bottom,
      };
    },
    await timeButton.elementHandle(),
  );
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

  const visibleTimes = (await timeButtons.allInnerTexts()).map((time) =>
    time.trim(),
  );
  const selectedTime = visibleTimes.reduce((earliestTime, candidateTime) => {
    const earliestStart = displayedTimeSlotStart(earliestTime);
    const candidateStart = displayedTimeSlotStart(candidateTime);

    expect(Number.isNaN(earliestStart)).toBe(false);
    expect(Number.isNaN(candidateStart)).toBe(false);

    return candidateStart < earliestStart ? candidateTime : earliestTime;
  });
  const selectedTimeButton = availableTimes.getByRole('button', {
    name: selectedTime,
    exact: true,
  });
  await expect(selectedTimeButton).toHaveCount(1);
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

test('Guest can browse a full day of Time Slots without page scrolling', async ({
  page,
  request,
}, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const journey = createUniqueJourneyData(testInfo);
  const bookingType = await createBookingType(request, journey.bookingType);

  await page.goto(`/guest/booking-types/${bookingType.id}`);
  const calendar = page.getByRole('region', { name: 'Calendar' });
  const fullDay = calendar
    .getByRole('button')
    .filter({ hasText: '16 free' })
    .first();
  await expect(fullDay).toBeVisible();
  await fullDay.click();

  const availableTimes = page.getByRole('region', {
    name: 'Available times',
  });
  const timeButtons = availableTimes.getByRole('button');
  await expect(timeButtons).toHaveCount(16);

  const continueButton = page.getByRole('button', {
    name: 'Continue',
    exact: true,
  });
  const continueBox = await continueButton.boundingBox();
  expect(continueBox).not.toBeNull();
  expect(continueBox!.y + continueBox!.height).toBeLessThanOrEqual(720);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  const lastTimeButton = timeButtons.last();
  const initialScrollState = await availableTimesScrollState(
    availableTimes,
    lastTimeButton,
  );
  expect(initialScrollState).not.toBeNull();
  expect(initialScrollState!.scrollHeight).toBeGreaterThan(
    initialScrollState!.clientHeight,
  );
  expect(initialScrollState!.buttonBottom).toBeGreaterThan(
    initialScrollState!.containerBottom,
  );

  await timeButtons.first().focus();
  for (let index = 0; index < 16; index += 1) {
    const timeButton = timeButtons.nth(index);
    await expect(timeButton).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(timeButton).toHaveAttribute('aria-pressed', 'true');

    if (index < 15) {
      await page.keyboard.press('Tab');
    }
  }

  const focusedScrollState = await availableTimesScrollState(
    availableTimes,
    lastTimeButton,
  );
  expect(focusedScrollState).not.toBeNull();
  expect(focusedScrollState!.scrollTop).toBeGreaterThan(0);
  expect(focusedScrollState!.buttonTop).toBeGreaterThanOrEqual(
    focusedScrollState!.containerTop,
  );
  expect(focusedScrollState!.buttonBottom).toBeLessThanOrEqual(
    focusedScrollState!.containerBottom,
  );

  for (let index = 0; index < 16; index += 1) {
    const timeButton = timeButtons.nth(index);
    await timeButton.click();
    await expect(timeButton).toHaveAttribute('aria-pressed', 'true');
  }
  await expect(lastTimeButton).toHaveCSS(
    'background-color',
    'rgb(255, 241, 235)',
  );
  await expect(lastTimeButton).toHaveCSS('border-color', 'rgb(217, 121, 88)');

  await expect(continueButton).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await continueButton.click();
  await expect(
    page.getByRole('heading', { name: 'Enter your details', exact: true }),
  ).toBeVisible();
});
