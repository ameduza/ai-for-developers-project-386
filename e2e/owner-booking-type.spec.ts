import { randomUUID } from 'node:crypto';
import { expect, test, type TestInfo } from '@playwright/test';

function createUniqueBookingType(testInfo: TestInfo) {
  const uniqueId = [
    Date.now(),
    testInfo.parallelIndex,
    testInfo.retry,
    randomUUID().slice(0, 8),
  ].join('-');

  return {
    title: `E2E Booking Type ${uniqueId}`,
    description: `Created by the Owner browser journey ${uniqueId}.`,
    durationMinutes: 15 + (Number.parseInt(randomUUID().slice(0, 4), 16) % 466),
  } as const;
}

test('Owner can create a Booking Type and see its exact details', async ({
  page,
}, testInfo) => {
  const bookingType = createUniqueBookingType(testInfo);

  await page.goto('/owner');
  await page.getByLabel('Title', { exact: true }).fill(bookingType.title);
  await page
    .getByLabel('Description', { exact: true })
    .fill(bookingType.description);
  await page
    .getByLabel('Duration', { exact: true })
    .fill(String(bookingType.durationMinutes));
  await page.getByRole('button', { name: 'Create booking type' }).click();

  const createdBookingType = page.getByRole('article').filter({
    has: page.getByRole('heading', {
      name: bookingType.title,
      exact: true,
    }),
  });

  await expect(
    createdBookingType.getByRole('heading', {
      name: bookingType.title,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    createdBookingType.getByText(bookingType.description, { exact: true }),
  ).toBeVisible();
  await expect(
    createdBookingType.getByText(`${bookingType.durationMinutes} min`, {
      exact: true,
    }),
  ).toBeVisible();
});
