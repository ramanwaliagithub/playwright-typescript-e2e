import type { APIRequestContext } from '@playwright/test';
import {
  RoomListSchema,
  BookingSchema,
  BookingListSchema,
  MessageListSchema,
  MessageSchema,
  LoginResponseSchema,
  type Room,
  type Booking,
  type MessageSummary,
  type Message,
} from './schemas.js';

export type RoomType = 'Single' | 'Twin' | 'Double' | 'Family' | 'Suite';
export type RoomFeature = 'WiFi' | 'TV' | 'Radio' | 'Refreshments' | 'Safe' | 'Views';

export interface NewRoom {
  roomName: string;
  type: RoomType;
  accessible: boolean;
  roomPrice: number;
  features?: RoomFeature[];
}

export interface NewBooking {
  roomid: number;
  firstname: string;
  lastname: string;
  depositpaid: boolean;
  bookingdates: { checkin: string; checkout: string };
}

export interface NewMessage {
  name: string;
  email: string;
  phone: string;
  subject: string;
  description: string;
}

/**
 * Thin typed wrapper over RBP's REST API. Every response is parsed through a zod schema, so a
 * shape drift in the API fails loudly here instead of silently breaking a page object.
 *
 * RBP has no token-refresh endpoint — `login()` stores the opaque token it returns and attaches
 * it as a `Cookie` header on every subsequent authenticated call (the app's own frontend sets it
 * as a real browser cookie via `document.cookie`, which a plain fetch/APIRequestContext can't do
 * automatically, so we do it explicitly).
 */
export class RbpApiClient {
  private authCookie: string | undefined;

  constructor(private readonly request: APIRequestContext) {}

  async login(username: string, password: string): Promise<void> {
    const res = await this.request.post('/api/auth/login', { data: { username, password } });
    const { token } = LoginResponseSchema.parse(await res.json());
    this.authCookie = `token=${token}`;
  }

  private authHeaders(): Record<string, string> {
    if (!this.authCookie) {
      throw new Error('RbpApiClient: call login() before making an authenticated request.');
    }
    return { Cookie: this.authCookie };
  }

  async listRooms(): Promise<Room[]> {
    const res = await this.request.get('/api/room');
    return RoomListSchema.parse(await res.json()).rooms;
  }

  async createRoom(room: NewRoom): Promise<void> {
    await this.request.post('/api/room', { data: room, headers: this.authHeaders() });
  }

  async deleteRoom(roomId: number): Promise<void> {
    await this.request.delete(`/api/room/${roomId}`, { headers: this.authHeaders() });
  }

  async createBooking(booking: NewBooking): Promise<Booking> {
    const res = await this.request.post('/api/booking', { data: booking });
    return BookingSchema.parse(await res.json());
  }

  async getBooking(bookingId: number): Promise<Booking> {
    const res = await this.request.get(`/api/booking/${bookingId}`, {
      headers: this.authHeaders(),
    });
    return BookingSchema.parse(await res.json());
  }

  async listBookingsForRoom(roomId: number): Promise<Booking[]> {
    const res = await this.request.get(`/api/booking?roomid=${roomId}`, {
      headers: this.authHeaders(),
    });
    return BookingListSchema.parse(await res.json()).bookings;
  }

  async deleteBooking(bookingId: number): Promise<void> {
    await this.request.delete(`/api/booking/${bookingId}`, { headers: this.authHeaders() });
  }

  async listMessages(): Promise<MessageSummary[]> {
    const res = await this.request.get('/api/message');
    return MessageListSchema.parse(await res.json()).messages;
  }

  async getMessage(messageId: number): Promise<Message> {
    const res = await this.request.get(`/api/message/${messageId}`);
    return MessageSchema.parse(await res.json());
  }

  async sendMessage(message: NewMessage): Promise<void> {
    await this.request.post('/api/message', { data: message });
  }

  async deleteMessage(messageId: number): Promise<void> {
    await this.request.delete(`/api/message/${messageId}`, { headers: this.authHeaders() });
  }
}
