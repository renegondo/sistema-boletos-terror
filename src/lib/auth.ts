import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { supabase } from './supabase';
import { User } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'boletos-super-secret-key-2026-production';
const COOKIE_NAME = 'boletos_session_token';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, phone, commission_type, commission_rate, is_active, created_at')
      .eq('id', decoded.userId)
      .eq('is_active', 1)
      .single();

    if (error || !user) return null;
    return user as User;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

export { COOKIE_NAME };
