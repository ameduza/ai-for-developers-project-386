export interface Owner {
  id: string;
  name: string;
  bio: string;
}

export interface BookingType {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface Guest {
  name: string;
  email: string;
}

export interface Booking {
  id: string;
  bookingType: BookingType;
  timeSlot: TimeSlot;
  guest: Guest;
}

export interface CreateBookingTypeInput {
  title: string;
  description: string;
  durationMinutes: number;
}

export interface Repository {
  getOwner(): Owner;
  listBookingTypes(): BookingType[];
  getBookingType(id: string): BookingType | undefined;
  createBookingType(input: CreateBookingTypeInput): BookingType;
  listBookings(): Booking[];
  getBooking(id: string): Booking | undefined;
  createBooking(booking: Omit<Booking, "id">): Booking;
  deleteBooking(id: string): boolean;
}

export class InMemoryRepository implements Repository {
  private readonly owner: Owner = {
    id: "owner-1",
    name: "Alex Morgan",
    bio: "Product designer and systems thinker.",
  };

  private readonly bookingTypes: BookingType[] = [
    {
      id: "booking-type-1",
      title: "Introductory call",
      description: "A short call to discuss your goals and next steps.",
      durationMinutes: 30,
    },
    {
      id: "booking-type-2",
      title: "Deep-dive consultation",
      description: "A focused session for exploring a specific challenge.",
      durationMinutes: 60,
    },
    {
      id: "booking-type-3",
      title: "Strategy workshop",
      description: "A longer workshop to turn ideas into an actionable plan.",
      durationMinutes: 90,
    },
  ];

  private readonly bookings: Booking[] = [];
  private nextBookingTypeId = this.bookingTypes.length + 1;
  private nextBookingId = 1;

  getOwner(): Owner {
    return this.owner;
  }

  listBookingTypes(): BookingType[] {
    return [...this.bookingTypes];
  }

  getBookingType(id: string): BookingType | undefined {
    return this.bookingTypes.find((bookingType) => bookingType.id === id);
  }

  createBookingType(input: CreateBookingTypeInput): BookingType {
    const bookingType = {
      id: `booking-type-${this.nextBookingTypeId++}`,
      ...input,
    };
    this.bookingTypes.push(bookingType);
    return bookingType;
  }

  listBookings(): Booking[] {
    return [...this.bookings];
  }

  getBooking(id: string): Booking | undefined {
    return this.bookings.find((booking) => booking.id === id);
  }

  createBooking(booking: Omit<Booking, "id">): Booking {
    const createdBooking = {
      id: `booking-${this.nextBookingId++}`,
      ...booking,
    };
    this.bookings.push(createdBooking);
    return createdBooking;
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
