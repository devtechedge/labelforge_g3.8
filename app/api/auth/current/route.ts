import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, DEMO_USERS } from '@/lib/auth/session';

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({
    user,
    availableUsers: DEMO_USERS,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const targetUserId = body.userId;

  const validUser = DEMO_USERS.find((u) => u.id === targetUserId);
  if (!validUser) {
    return NextResponse.json({ error: 'Invalid user persona ID' }, { status: 400 });
  }

  const response = NextResponse.json({ success: true, user: validUser });
  response.cookies.set('lf_user_id', validUser.id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
