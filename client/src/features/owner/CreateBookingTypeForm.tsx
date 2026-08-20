import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createBookingTypeSchema, type CreateBookingTypeFormData } from "@/features/owner/schemas";
import { useCreateOwnerBookingTypeMutation } from "@/features/owner/queries";

export function CreateBookingTypeForm() {
  const [successMessage, setSuccessMessage] = useState("");

  const mutation = useCreateOwnerBookingTypeMutation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateBookingTypeFormData>({
    resolver: zodResolver(createBookingTypeSchema),
    defaultValues: {
      title: "",
      description: "",
      durationMinutes: 30,
    },
  });

  const onSubmit = async (data: CreateBookingTypeFormData) => {
    try {
      await mutation.mutateAsync(data);
      setSuccessMessage("Booking type created successfully!");
      reset();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error creating booking type:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Booking Type</CardTitle>
        <CardDescription>
          Add a new service or offering that guests can book.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Title
            </label>
            <input
              id="title"
              type="text"
              placeholder="e.g., Strategy Session"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("title")}
              disabled={isSubmitting || mutation.isPending}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Description
            </label>
            <textarea
              id="description"
              placeholder="Describe what this booking type is about..."
              rows={4}
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("description")}
              disabled={isSubmitting || mutation.isPending}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="duration" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Duration (minutes)
            </label>
            <input
              id="duration"
              type="number"
              placeholder="30"
              min="15"
              max="480"
              step="15"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("durationMinutes", { valueAsNumber: true })}
              disabled={isSubmitting || mutation.isPending}
            />
            {errors.durationMinutes && (
              <p className="text-xs text-destructive">{errors.durationMinutes.message}</p>
            )}
          </div>

          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
              {successMessage}
            </div>
          )}

          {mutation.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              Failed to create booking type. Please try again.
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            className="w-full"
          >
            {mutation.isPending ? "Creating..." : "Create Booking Type"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
