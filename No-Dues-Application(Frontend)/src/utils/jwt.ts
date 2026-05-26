import { jwtDecode } from 'jwt-decode';
import type { DecodedToken } from '../types/auth.types';

export function decodeToken(token: string): DecodedToken | null {
  try {
    return jwtDecode<DecodedToken>(token);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  return decoded.exp * 1000 < Date.now();
}

export function getTokenRoles(token: string): string[] {
  const decoded = decodeToken(token);
  if (!decoded) return [];
  return decoded.resource_access?.['backend-api']?.roles ?? [];
}

export function getTokenExpiresAt(token: string): Date | null {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  return new Date(decoded.exp * 1000);
}
