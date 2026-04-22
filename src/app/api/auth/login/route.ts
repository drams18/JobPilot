import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ message: 'Email et mot de passe requis' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ message: 'Identifiants invalides' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ message: 'Identifiants invalides' }, { status: 401 });
  }

  const accessToken = signToken({ userId: user.id, email: user.email });

  return NextResponse.json({
    accessToken,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
