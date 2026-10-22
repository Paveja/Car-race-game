import { auth } from '@clerk/nextjs/server';

export async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const result = await auth();
    return result.userId;
  } catch {
    return null;
  }
}
