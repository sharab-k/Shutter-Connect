export type Role = 'client' | 'photographer' | 'admin';
export type IdStatus = 'unverified' | 'pending' | 'verified';
export type PaymentMode = 'upfront' | 'after' | 'deposit';
export type BookingStatus = 'requested' | 'confirmed' | 'declined' | 'cancelled' | 'completed';
export type ProStatus = 'approved' | 'pending' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  idStatus: IdStatus;
  emailReminders: boolean;
  joined: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  durationHrs: number;
  paymentMode: PaymentMode;
  depositPct: number;
}

export interface DayHours {
  start: string;
  end: string;
}

export interface Photographer {
  id: string;
  userId: string;
  name: string;
  business: string;
  tagline: string;
  bio: string;
  niches: string[];
  city: string;
  state: string;
  status: ProStatus;
  vetted: boolean;
  services: Service[];
  portfolio: string[];
  /** index 0 = Sunday */
  availability: (DayHours | null)[];
  blockedDates: string[];
  stripeConnected: boolean;
  dropboxConnected: boolean;
  subscriptionActive: boolean;
  joined: string;
}

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  photographerId: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  durationHrs: number;
  location: string;
  notes: string;
  status: BookingStatus;
  total: number;
  paymentMode: PaymentMode;
  depositPct: number;
  paid: number;
  deliveryLink?: string;
  declineReason?: string;
  clientReviewed: boolean;
  photographerReviewed: boolean;
  createdAt: number;
}

export interface Message {
  image?: string;
  reactions?: Record<string, string>;
  id: string;
  threadId: string;
  fromUserId: string;
  text: string;
  at: number;
}

export interface Review {
  id: string;
  bookingId: string;
  fromRole: 'client' | 'photographer';
  fromName: string;
  /** photographer id when fromRole is client, client user id when fromRole is photographer */
  toId: string;
  rating: number;
  text: string;
  at: number;
}

export interface Payment {
  id: string;
  bookingId: string;
  photographerId: string;
  amount: number;
  fee: number;
  stage: 'deposit' | 'balance' | 'full' | 'refund';
  at: number;
  refunded?: boolean;
}

export interface Notif {
  id: string;
  userId: string;
  text: string;
  link?: string;
  at: number;
  read: boolean;
}

export interface Dispute {
  id: string;
  bookingId: string;
  openedBy: string;
  reason: string;
  status: 'open' | 'resolved' | 'refunded';
  at: number;
}

export interface DB {
  users: User[];
  photographers: Photographer[];
  bookings: Booking[];
  messages: Message[];
  reviews: Review[];
  payments: Payment[];
  notifications: Notif[];
  disputes: Dispute[];
  posts: Post[];
  /** userId -> photographer ids they follow */
  follows: Record<string, string[]>;
  /** userId -> photographer ids whose story they have seen */
  storySeen: Record<string, string[]>;
  /** `userId|threadId` -> timestamp of last read */
  reads: Record<string, number>;
  sessionUserId: string | null;
}

export const NICHES = [
  'Wedding',
  'Portrait',
  'Family',
  'Newborn',
  'Events',
  'Real Estate',
  'Headshots',
  'Sports',
  'Product',
  'Senior',
] as const;

export const CITIES = [
  'Allentown',
  'Bethlehem',
  'Easton',
  'Emmaus',
  'Whitehall',
  'Macungie',
  'Nazareth',
  'Center Valley',
] as const;

export const PLATFORM_FEE = 0.0225;
export const SUBSCRIPTION_PRICE = 199;

export interface Comment {
  id: string;
  userId: string;
  name: string;
  text: string;
  at: number;
}

export interface Post {
  id: string;
  photographerId: string;
  /** picsum seed, or a data: URL for uploaded images */
  image: string;
  ratio: 'square' | 'portrait' | 'landscape';
  caption: string;
  tags: string[];
  location: string;
  at: number;
  /** likes from people who do not exist in the demo data */
  baseLikes: number;
  likes: string[];
  saves: string[];
  comments: Comment[];
}
