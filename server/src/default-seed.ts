import type { Seed } from './repository.js';

export const defaultSeed: Seed = {
  owner: {
    id: 'owner-1',
    name: 'Alex Morgan',
    bio: 'Product designer and systems thinker.',
  },
  bookingTypes: [
    {
      id: 'booking-type-1',
      title: 'Introductory call',
      description: 'A short call to discuss your goals and next steps.',
      durationMinutes: 30,
    },
    {
      id: 'booking-type-2',
      title: 'Deep-dive consultation',
      description: 'A focused session for exploring a specific challenge.',
      durationMinutes: 60,
    },
    {
      id: 'booking-type-3',
      title: 'Strategy workshop',
      description: 'A longer workshop to turn ideas into an actionable plan.',
      durationMinutes: 90,
    },
  ],
  bookings: [],
};
