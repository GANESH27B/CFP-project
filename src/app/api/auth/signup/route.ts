import { NextResponse } from 'next/server';

/**
 * Public self-signup is DISABLED.
 * All user accounts must be created by an admin via /api/users (POST).
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Self-registration is not allowed. Please contact your administrator.' },
    { status: 403 }
  );
}
