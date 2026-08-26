import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError } from "@/lib/api/generated";
import type { TimeSlot } from "@/lib/api/generated";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  createBookingSchema,
  type CreateBookingFormData,
} from "@/features/guest/schemas";
import { useCreateBookingMutation } from "@/features/guest/queries";
import { formatTimeSlot } from "@/features/guest/format-time-slot";
import { extractApiErrorMessage } from "@/lib/api/extract-error-message";

type BookingFormProps = {
  bookingTypeId: string;
  timeSlot: TimeSlot;
};

export function BookingForm({ bookingTypeId, timeSlot }: BookingFormProps) {
  const navigate = useNavigate();
  const mutation = useCreateBookingMutation();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateBookingFormData>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      bookingTypeId,
      slotStart: timeSlot.startTime,
      slotEnd: timeSlot.endTime,
      guestName: "",
      guestEmail: "",
    },
  });

  const onSubmit = async (data: CreateBookingFormData) => {
    try {
      const booking = await mutation.mutateAsync({
        bookingTypeId: data.bookingTypeId,
        timeSlotStart: data.slotStart,
        timeSlotEnd: data.slotEnd,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
      });
      navigate(`/bookings/${booking.id}`);
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setError("root.serverError", {
          type: "server",
          message: "Could not create the booking. Please try again.",
        });
        return;
      }

      if (error.status === 409) {
        setError("root.slotTaken", {
          type: "server",
          message:
            "This time slot is no longer available. Please pick another one.",
        });
        return;
      }

      if (error.status === 400) {
        const message = extractApiErrorMessage(error);
        let mappedToField = false;

        if (/email/i.test(message)) {
          setError("guestEmail", { type: "server", message });
          mappedToField = true;
        }

        if (/name/i.test(message)) {
          setError("guestName", { type: "server", message });
          mappedToField = true;
        }

        if (!mappedToField) {
          setError("root.serverError", { type: "server", message });
        }

        return;
      }

      setError("root.serverError", {
        type: "server",
        message: extractApiErrorMessage(error),
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book this time slot</CardTitle>
        <CardDescription>
          <time dateTime={timeSlot.startTime}>{formatTimeSlot(timeSlot)}</time>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="guestName"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Your name
            </label>
            <input
              id="guestName"
              type="text"
              placeholder="e.g., Ada Lovelace"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("guestName")}
              disabled={isSubmitting || mutation.isPending}
            />
            {errors.guestName && (
              <p className="text-xs text-destructive">
                {errors.guestName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="guestEmail"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Your email
            </label>
            <input
              id="guestEmail"
              type="email"
              placeholder="e.g., ada@example.com"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("guestEmail")}
              disabled={isSubmitting || mutation.isPending}
            />
            {errors.guestEmail && (
              <p className="text-xs text-destructive">
                {errors.guestEmail.message}
              </p>
            )}
          </div>

          {errors.root?.slotTaken && (
            <p role="alert" className="text-sm text-destructive">
              {errors.root.slotTaken.message}
            </p>
          )}

          {errors.root?.serverError && (
            <p role="alert" className="text-sm text-destructive">
              {errors.root.serverError.message}
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            className="w-full"
          >
            {mutation.isPending ? "Booking..." : "Confirm booking"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
