import { NextResponse } from 'next/server';
import { userExists, usernameExists } from '@/services/userService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const email = searchParams.get("email");
    const username = searchParams.get("username");

    const resultEmail = email ? await userExists(email) : false;
    const resultUsername = username ? await usernameExists(username) : false;

    return NextResponse.json({
      status: 200,
      exists: resultEmail, // backward-compat for existing callers
      usernameExists: resultUsername,
    }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ status: 500, error: e.message }, { status: 500 })
  }
}
