// types/index.ts
import type { Role, ProfileStatus, BookingStatus, PaymentStatus } from "@prisma/client";

export type { Role, ProfileStatus, BookingStatus, PaymentStatus };

export interface MasseuseWithDetails {
  id: string;
  slug: string;
  bio: string;
  avatarUrl: string | null;
  avgRating: number;
  totalReviews: number;
  yearsExperience: number | null;
  languages: string[];
  status: ProfileStatus;
  city: {
    id: number;
    name: string;
    slug: string;
    county: { name: string };
  } | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  services: ServiceItem[];
  photos: PhotoItem[];
  reviews: ReviewItem[];
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: string;
  isActive: boolean;
}

export interface PhotoItem {
  id: string;
  url: string;
  altText: string | null;
  isCover: boolean;
  order: number;
}

export interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  client: {
    name: string;
    image: string | null;
  };
}

export interface BookingWithDetails {
  id: string;
  scheduledAt: string;
  status: BookingStatus;
  notes: string | null;
  totalAmount: string;
  createdAt: string;
  client: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  service: ServiceItem;
  payment: {
    id: string;
    status: PaymentStatus;
    merchantReference: string;
    orderTrackingId: string | null;
  } | null;
  review: {
    id: string;
    rating: number;
    comment: string | null;
  } | null;
}

export interface SearchFilters {
  location?: string;
  service?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: "rating" | "price_asc" | "price_desc" | "newest";
  page?: number;
}

// Session type is augmented in lib/auth.ts
