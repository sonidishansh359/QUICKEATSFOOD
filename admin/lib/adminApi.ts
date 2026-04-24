export const fetchUnapprovedRestaurants = async (): Promise<AdminRestaurant[]> => {
  const adminKey = import.meta.env.VITE_ADMIN_API_KEY || 'quickeats-admin';
  const res = await fetch(`${API_BASE_URL}/restaurants/admin/unapproved`, {
    headers: {
      'x-admin-key': adminKey,
    },
  });
  return handleResponse<AdminRestaurant[]>(res);
};

export const approveRestaurant = async (id: string) => {
  const adminKey = import.meta.env.VITE_ADMIN_API_KEY || 'quickeats-admin';
  const res = await fetch(`${API_BASE_URL}/restaurants/admin/approve/${id}`, {
    method: 'PUT',
    headers: {
      'x-admin-key': adminKey,
    },
  });
  return handleResponse<{ message: string; restaurant: AdminRestaurant }>(res);
};
const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";

export interface AdminStats {
  appRating: number;
  averageDelivery: number;
  cities: number;
  happyCustomers: number;
  totalRestaurants: number;
  totalReviews: number;
  totalOrders: number;
  totalRevenue?: number;
}

export interface AdminRestaurant {
  _id: string;
  name: string;
  address: string;
  phone?: string;
  cuisine?: string;
  image?: string;
  rating?: number;
  isOpen?: boolean;
  owner?: { _id?: string; name?: string; email?: string } | string;
  deleted?: boolean;
  approved?: boolean;
  verification?: {
    aadharRequested: boolean;
    aadharImage?: string;
    adminMessage?: string;
    ownerResponse?: string;
    status: 'none' | 'requested' | 'submitted' | 'verified' | 'rejected';
  };
}

export const requestVerification = async (id: string, message?: string) => {
  const adminKey = import.meta.env.VITE_ADMIN_API_KEY || 'quickeats-admin';
  const res = await fetch(`${API_BASE_URL}/restaurants/admin/verification-request/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify({ adminMessage: message }),
  });
  return handleResponse<{ message: string; restaurant: AdminRestaurant }>(res);
};

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  banned?: boolean;
  deleted?: boolean;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }
  return response.json() as Promise<T>;
};

export const fetchAdminStats = async (): Promise<AdminStats> => {
  const res = await fetch(`${API_BASE_URL}/stats`);
  return handleResponse<AdminStats>(res);
};

export const fetchAdminRestaurants = async (): Promise<AdminRestaurant[]> => {
  const res = await fetch(`${API_BASE_URL}/restaurants`);
  return handleResponse<AdminRestaurant[]>(res);
};

export const fetchAdminUsers = async (): Promise<AdminUser[]> => {
  const adminKey = import.meta.env.VITE_ADMIN_API_KEY || 'quickeats-admin';
  const res = await fetch(`${API_BASE_URL}/users/admin/all`, {
    headers: {
      'x-admin-key': adminKey,
    },
  });
  return handleResponse<AdminUser[]>(res);
};

export const setUserBan = async (id: string, banned: boolean) => {
  const adminKey = import.meta.env.VITE_ADMIN_API_KEY || 'quickeats-admin';
  const res = await fetch(`${API_BASE_URL}/users/admin/${id}/ban`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify({ banned }),
  });
  return handleResponse<{ message: string; user: AdminUser }>(res);
};

export const deleteAdminRestaurant = async (id: string) => {
  const adminKey = import.meta.env.VITE_ADMIN_API_KEY || 'quickeats-admin';
  const res = await fetch(`${API_BASE_URL}/restaurants/${id}/admin`, {
    method: 'DELETE',
    headers: {
      'x-admin-key': adminKey,
    },
  });
  return handleResponse<{ message: string; restaurantId: string }>(res);
};

export const hardDeleteAdminRestaurant = async (id: string) => {
  const adminKey = import.meta.env.VITE_ADMIN_API_KEY || 'quickeats-admin';
  const res = await fetch(`${API_BASE_URL}/restaurants/${id}/admin/hard`, {
    method: 'DELETE',
    headers: {
      'x-admin-key': adminKey,
    },
  });
  return handleResponse<{ message: string; restaurantId: string }>(res);
};

export const fetchAdminReviews = async () => {
  const res = await fetch(`${API_BASE_URL}/reviews/all`);
  return handleResponse<any[]>(res);
};

export const pingApi = async (): Promise<{ ok: boolean; message?: string }> => {
  try {
    await fetch(`${API_BASE_URL}/stats`, { method: "HEAD" });
    return { ok: true };
  } catch (err: any) {
    return { ok: false, message: err?.message || "API unreachable" };
  }
};
export const fetchAdminBalance = async () => {
  const adminKey = import.meta.env.VITE_ADMIN_API_KEY || 'quickeats-admin';
  const token = localStorage.getItem('adminToken');
  console.log('[AdminAPI] Fetching balance. Token present:', !!token, 'Token length:', token?.length);

  const res = await fetch(`${API_BASE_URL}/admin-earnings/balance`, {
    headers: {
      'x-admin-key': adminKey,
      'x-auth-token': token || ''
    },
  });
  return handleResponse<{ availableBalance: number; totalEarnings: number }>(res);
};

export const fetchAdminTransactions = async () => {
  const adminKey = import.meta.env.VITE_ADMIN_API_KEY || 'quickeats-admin';
  const token = localStorage.getItem('adminToken');
  console.log('[AdminAPI] Fetching transactions. Token present:', !!token);

  const res = await fetch(`${API_BASE_URL}/admin-earnings/transactions`, {
    headers: {
      'x-admin-key': adminKey,
      'x-auth-token': token || ''
    },
  });
  return handleResponse<any[]>(res);
};

export const addAdminMoney = async (amount: number) => {
  const adminKey = import.meta.env.VITE_ADMIN_API_KEY || 'quickeats-admin';
  const token = localStorage.getItem('adminToken');

  const res = await fetch(`${API_BASE_URL}/admin-earnings/add-money`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
      'x-auth-token': token || ''
    },
    body: JSON.stringify({ amount })
  });
  return handleResponse<{ message: string; availableBalance: number }>(res);
};

export const withdrawAdminMoney = async (amount: number) => {
  const adminKey = import.meta.env.VITE_ADMIN_API_KEY || 'quickeats-admin';
  const token = localStorage.getItem('adminToken');

  const res = await fetch(`${API_BASE_URL}/admin-earnings/withdraw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
      'x-auth-token': token || ''
    },
    body: JSON.stringify({ amount })
  });
  return handleResponse<{ message: string; availableBalance: number }>(res);
};

export const fetchAdminReports = async (params: Record<string, any>) => {
  const adminKey = import.meta.env.VITE_ADMIN_API_KEY || 'quickeats-admin';
  const token = localStorage.getItem('adminToken');
  const query = new URLSearchParams(params).toString();

  const res = await fetch(`${API_BASE_URL}/admin/reports?${query}`, {
    headers: {
      'x-admin-key': adminKey,
      'Authorization': `Bearer ${token}`
    },
  });
  return handleResponse<any>(res);
};

export const exportAdminReports = async (type: 'csv' | 'pdf', params: Record<string, any>) => {
  const adminKey = import.meta.env.VITE_ADMIN_API_KEY || 'quickeats-admin';
  const token = localStorage.getItem('adminToken');
  const query = new URLSearchParams(params).toString();

  const url = `${API_BASE_URL}/admin/reports/export/${type}?${query}`;

  const res = await fetch(url, {
    headers: {
      'x-admin-key': adminKey,
      'Authorization': `Bearer ${token}`
    },
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Export failed");
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${params.type || 'report'}_${params.from || 'start'}_${params.to || 'end'}.${type}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
};
