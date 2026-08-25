import type {
  Booking,
  BookingType,
  CreateBookingType,
  Owner,
  TimeSlot,
} from "./generated/api-models.js";

export type { Booking, BookingType, Owner, TimeSlot };

export interface FixtureBooking extends Omit<Booking, "bookingType"> {
  bookingTypeId: string;
}

export interface Fixture {
  owner: Owner;
  bookingTypes: BookingType[];
  bookings: FixtureBooking[];
}

export interface Repository {
  getOwner(): Owner;
  listBookingTypes(): BookingType[];
  getBookingType(id: string): BookingType | undefined;
  createBookingType(input: CreateBookingType): BookingType;
  listBookings(): Booking[];
  getBooking(id: string): Booking | undefined;
  createBooking(booking: Omit<Booking, "id">): Booking;
  deleteBooking(id: string): boolean;
}

function assertUniqueIds(
  entityName: string,
  entities: ReadonlyArray<{ id: string }>,
): void {
  const ids = new Set<string>();
  for (const entity of entities) {
    if (ids.has(entity.id)) {
      throw new Error(`Duplicate ${entityName} identifier: ${entity.id}`);
    }
    ids.add(entity.id);
  }
}

function nextIdentifier(
  prefix: string,
  existingIds: ReadonlyArray<string>,
): string {
  const numericSuffixes = existingIds
    .map((id) => new RegExp(`^${prefix}-(\\d+)$`).exec(id))
    .map((match) => (match ? Number(match[1]) : 0))
    .filter((suffix) => Number.isSafeInteger(suffix));
  return `${prefix}-${Math.max(0, ...numericSuffixes) + 1}`;
}

function cloneBooking(booking: Booking): Booking {
  return {
    ...booking,
    bookingType: { ...booking.bookingType },
    timeSlot: { ...booking.timeSlot },
    guest: { ...booking.guest },
  };
}

export class InMemoryRepository implements Repository {
  private readonly owner: Owner;
  private readonly bookingTypes: BookingType[];
  private readonly bookings: Booking[];

  constructor(fixture: Fixture) {
    assertUniqueIds("Booking Type", fixture.bookingTypes);
    assertUniqueIds("Booking", fixture.bookings);

    this.owner = { ...fixture.owner };
    this.bookingTypes = fixture.bookingTypes.map((bookingType) => ({
      ...bookingType,
    }));
    const bookingTypesById = new Map(
      this.bookingTypes.map((bookingType) => [bookingType.id, bookingType]),
    );
    this.bookings = fixture.bookings.map((fixtureBooking) => {
      const bookingType = bookingTypesById.get(fixtureBooking.bookingTypeId);
      if (!bookingType) {
        throw new Error(
          `Booking ${fixtureBooking.id} references missing Booking Type: ${fixtureBooking.bookingTypeId}`,
        );
      }
      const { bookingTypeId, ...booking } = fixtureBooking;
      void bookingTypeId;
      return cloneBooking({ ...booking, bookingType });
    });
  }

  getOwner(): Owner {
    return { ...this.owner };
  }

  listBookingTypes(): BookingType[] {
    return this.bookingTypes.map((bookingType) => ({ ...bookingType }));
  }

  getBookingType(id: string): BookingType | undefined {
    const bookingType = this.bookingTypes.find(
      (candidate) => candidate.id === id,
    );
    return bookingType && { ...bookingType };
  }

  createBookingType(input: CreateBookingType): BookingType {
    const bookingType = {
      id: nextIdentifier(
        "booking-type",
        this.bookingTypes.map((candidate) => candidate.id),
      ),
      ...input,
    };
    this.bookingTypes.push(bookingType);
    return { ...bookingType };
  }

  listBookings(): Booking[] {
    return this.bookings.map(cloneBooking);
  }

  getBooking(id: string): Booking | undefined {
    const booking = this.bookings.find((candidate) => candidate.id === id);
    return booking && cloneBooking(booking);
  }

  createBooking(booking: Omit<Booking, "id">): Booking {
    const createdBooking = {
      id: nextIdentifier(
        "booking",
        this.bookings.map((candidate) => candidate.id),
      ),
      bookingType: { ...booking.bookingType },
      timeSlot: { ...booking.timeSlot },
      guest: { ...booking.guest },
    };
    this.bookings.push(createdBooking);
    return cloneBooking(createdBooking);
  }

  deleteBooking(id: string): boolean {
    const index = this.bookings.findIndex((booking) => booking.id === id);
    if (index < 0) {
      return false;
    }
    this.bookings.splice(index, 1);
    return true;
  }
}
