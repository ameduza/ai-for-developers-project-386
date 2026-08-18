import "@typespec/http";
import "@typespec/rest";

using Http;
using Rest;

// ─── Models ───────────────────────────────────────────────────────────

/** A predefined owner profile (read-only, no auth). */
model Owner {
  @key
  id: string;
  name: string;
  bio: string;
}

/** A bookable session type the owner offers. */
model BookingType {
  @key
  id: string;
  title: string;
  description: string;
  durationMinutes: int32;
}

model CreateBookingType {
  title: string;
  description: string;
  durationMinutes: int32;
}

model UpdateBookingType {
  title?: string;
  description?: string;
  durationMinutes?: int32;
}

/** An available time window within the 14-day booking window. */
model TimeSlot {
  @key
  id: string;
  startTime: utcDateTime;
  endTime: utcDateTime;
  available: boolean;
}

/** Visitor contact details provided when booking. */
model Visitor {
  name: string;
  email: string;
}

/** A confirmed booking made by a visitor for a specific time slot. */
model Booking {
  @key
  id: string;
  bookingType: BookingType;
  timeSlot: TimeSlot;
  visitor: Visitor;
}

model CreateBooking {
  bookingTypeId: string;
  timeSlotId: string;
  visitor: Visitor;
}

model Error {
  code: string;
  message: string;
}

/** Generic paginated list wrapper. */
model List<T> {
  items: T[];
}

// ─── API Contract ─────────────────────────────────────────────────────

@service(#{ title: "Booking Service" })
namespace BookingService {
  // ─── Owner routes ─────────────────────────────────────────────

  @route("/owner")
  namespace OwnerRoutes {
    /** Retrieve the predefined owner profile. */
    @get
    op getOwner(): Owner;

    /** List all booking types (owner view). */
    @get
    @route("/booking-types")
    op listBookingTypes(): List<BookingType>;

    /** Create a new booking type. */
    @post
    @route("/booking-types")
    op createBookingType(@body bookingType: CreateBookingType): BookingType;

    /** Update an existing booking type. */
    @patch
    @route("/booking-types/{id}")
    op updateBookingType(
      @path id: string,
      @body bookingType: UpdateBookingType,
    ): BookingType;

    /** View upcoming bookings across all booking types. */
    @get
    @route("/bookings")
    op listUpcomingBookings(): List<Booking>;
  }

  // ─── Visitor routes ───────────────────────────────────────────

  @route("/booking-types")
  namespace BookingTypes {
    /** List booking types visible to visitors. */
    @get
    op listBookingTypes(): List<BookingType>;

    /** List available time slots for a booking type within the next 14 days. */
    @get
    @route("/{id}/slots")
    op listSlots(@path id: string): List<TimeSlot>;
  }

  @route("/bookings")
  namespace Bookings {
    /** Create a booking for a chosen time slot. */
    @post
    op create(
      @body booking: CreateBooking,
    ):
      | { @statusCode statusCode: 201; @body body: Booking; }
      | { @statusCode statusCode: 409; @body body: Error; }
      | { @statusCode statusCode: 422; @body body: Error; };
  }
}
