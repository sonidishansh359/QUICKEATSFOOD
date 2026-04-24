export type UserRole = 'user' | 'owner' | 'delivery';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  profilePicture?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Restaurant {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  cuisine: string;
  address: string;
  phone: string;
  image: string;
  isOpen: boolean;
  rating: number;
  deliveryTime: string;
  minOrder: number;
  createdAt: string;
  status?: 'OPEN' | 'CLOSED' | 'OPENING_SOON' | 'CLOSING_SOON';
  // Extended properties
  email?: string;
  website?: string;
  deliveryFee?: number;
  taxRate?: number;
  commissionRate?: number;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  openingTime?: string;
  openingPeriod?: 'AM' | 'PM';
  closingTime?: string;
  closingPeriod?: 'AM' | 'PM';
  openTime?: string;
  closeTime?: string;
  openOnWeekends?: boolean;
  acceptCash?: boolean;
  acceptCard?: boolean;
  acceptDigital?: boolean;
  hasWifi?: boolean;
  hasOutdoor?: boolean;
  hasParking?: boolean;
  hasDelivery?: boolean;
  hasTakeaway?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  apiKey?: string;
  apiSecret?: string;
  categories?: string[];
  discount?: number;
  hasOffers?: boolean;
  isNew?: boolean;
  healthyOptions?: boolean;
  isPremium?: boolean;
  approved?: boolean;
  verification?: {
    aadharRequested: boolean;
    aadharImage?: string;
    adminMessage?: string;
    ownerResponse?: string;
    status: 'none' | 'requested' | 'submitted' | 'verified' | 'rejected';
  };
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  dietaryType: 'Veg' | 'NonVeg';
  isAvailable: boolean;
  createdAt: string;
  // Extended properties
  preparationTime?: number;
  calories?: number;
  ingredients?: string;
}

export interface Order {
  id: string;
  restaurantId: string;
  userId: string;
  deliveryBoyId?: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  ownerEarning?: number;
  adminEarning?: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  specialInstructions?: string;
  createdAt: string;
  paymentMethod?: 'cod' | 'online' | 'upi' | 'card';
  paymentStatus?: 'paid' | 'unpaid' | 'pay_on_delivery' | 'cash_collected';
  updatedAt: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  originalPrice?: number;
}

export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'preparing'
  | 'out_for_delivery'
  | 'picked'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled';

export interface DeliveryBoy {
  id: string;
  _id?: string;
  name: string;
  phone: string;
  isAvailable: boolean;
  vehicle?: string;
  user?: {
    _id?: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface EarningsData {
  date: string;
  orders: number;
  revenue: number;
}
