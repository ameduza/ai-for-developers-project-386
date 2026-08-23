/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BookingType } from "./BookingType";
import type { Guest } from "./Guest";
import type { TimeSlot } from "./TimeSlot";
/**
 * A confirmed booking made by a guest for a specific time slot.
 */
export type Booking = {
  id: string;
  bookingType: BookingType;
  timeSlot: TimeSlot;
  guest: Guest;
};
