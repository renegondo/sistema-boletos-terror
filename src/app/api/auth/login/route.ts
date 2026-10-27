import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { signToken, COOKIE_NAME } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Correo y contraseña requeridos' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .eq('is_active', 1)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas o usuario inactivo' },
        { status: 401 }
      );
    }

    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        commission_type: user.commission_type,
        commission_rate: user.commission_rate,
      },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno en autenticación' },
      { status: 500 }
    );
  }
}
