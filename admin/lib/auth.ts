let _token: string | null = null;

export interface TokenPayload {
  sub: string;
  phone: string;
  role: string;
}

export function getToken(): string | null {
  if (_token) return _token;
  if (typeof window !== 'undefined') {
    _token = localStorage.getItem('admin_token');
  }
  return _token;
}

export function setToken(token: string): void {
  _token = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_token', token);
  }
}

export function clearToken(): void {
  _token = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
  }
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)) as TokenPayload;
  } catch {
    return null;
  }
}
