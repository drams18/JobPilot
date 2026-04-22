import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { email, name, password } = await request.json();

  if (!email || !name || !password) {
    return NextResponse.json({ message: 'Tous les champs sont requis' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ message: 'Cet email est déjà utilisé' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, name, passwordHash },
  });

  const accessToken = signToken({ userId: user.id, email: user.email });

  return NextResponse.json({
    accessToken,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
