import { z } from 'zod';

export const RoomSchema = z.object({
  roomid: z.number(),
  roomName: z.string(),
  type: z.string(),
  accessible: z.boolean(),
  roomPrice: z.number(),
  // Only the 3 originally-seeded rooms have these — rooms created via the admin panel/API
  // (no description/image field in that form) never get them.
  description: z.string().optional(),
  image: z.string().optional(),
  features: z.array(z.string()),
});
export type Room = z.infer<typeof RoomSchema>;

export const RoomListSchema = z.object({ rooms: z.array(RoomSchema) });

export const BookingDatesSchema = z.object({
  checkin: z.string(),
  checkout: z.string(),
});

export const BookingSchema = z.object({
  bookingid: z.number(),
  roomid: z.number(),
  firstname: z.string(),
  lastname: z.string(),
  depositpaid: z.boolean(),
  bookingdates: BookingDatesSchema,
});
export type Booking = z.infer<typeof BookingSchema>;

export const BookingListSchema = z.object({ bookings: z.array(BookingSchema) });

export const MessageSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  subject: z.string(),
  read: z.boolean(),
});
export type MessageSummary = z.infer<typeof MessageSummarySchema>;

export const MessageListSchema = z.object({ messages: z.array(MessageSummarySchema) });

export const MessageSchema = z.object({
  messageid: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  subject: z.string(),
  description: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

export const LoginResponseSchema = z.object({ token: z.string() });
