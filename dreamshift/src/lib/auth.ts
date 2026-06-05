import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-change-me') as { userId: string };
    return decoded.userId;
  } catch (error) {
    return null;
  }
}
