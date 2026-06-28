const BASE_URL = 'http://127.0.0.1:8000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export async function apiGet(endpoint: string) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers,
  });

  if (res.status === 401) {
    localStorage.clear();
    window.location.href = '/signin';
    return { error: 'Unauthenticated' };
  }

  return res.json();
}

export async function apiPost(endpoint: string, body: object) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    localStorage.clear();
    window.location.href = '/signin';
    return { error: 'Unauthenticated' };
  }

  return res.json();
}

export async function apiPatch(endpoint: string, body: object) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    localStorage.clear();
    window.location.href = '/signin';
    return { error: 'Unauthenticated' };
  }

  return res.json();
}

export async function apiDelete(endpoint: string) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers,
  });

  if (res.status === 401) {
    localStorage.clear();
    window.location.href = '/signin';
    return { error: 'Unauthenticated' };
  }

  return res.json();
}

export function saveToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
}