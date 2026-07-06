export interface Business {
  id: string;
  name: string;
  description: string;
  category: string; // e.g. "gastronomia", "servicos", "saude", "lojas", "automotivo"
  address: string;
  neighborhood: string;
  phone: string; // e.g. "(16) 99999-9999"
  whatsapp: string; // URL or clean number for direct click
  instagram?: string; // Instagram handle
  rating: number;
  reviewsCount: number;
  image: string;
  isFeatured: boolean;
  hours: string; // e.g. "Seg - Sáb: 08:00 às 18:00"
  tags: string[];
}

export interface Category {
  slug: string;
  name: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class e.g. "bg-amber-100 text-amber-600"
  description: string;
}

export interface Coupon {
  id: string;
  businessId: string;
  businessName: string;
  discountCode: string;
  description: string;
  expiryDate: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  image: string;
}

export interface Review {
  id: string;
  businessId: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface UsefulNumber {
  name: string;
  phone: string;
  description: string;
  category: string; // "emergencia" | "servicos"
}
