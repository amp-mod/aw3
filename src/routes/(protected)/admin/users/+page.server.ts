import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
  // 2. Fetch all users
  const users = await db
    .select({
      id: table.user.id,
      username: table.user.username,
      rank: table.user.rank
    })
    .from(table.user)
    .orderBy(asc(table.user.username));

  return { users };
};

export const actions: Actions = {
  updateRank: async ({ request }) => {
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    const newRank = parseInt(formData.get('rank') as string);

    if (isNaN(newRank) || newRank < 0 || newRank > 3) {
      return fail(400, { message: 'Invalid rank' });
    }

    try {
      await db.update(table.user).set({ rank: newRank }).where(eq(table.user.id, userId));

      return { success: true };
    } catch {
      return fail(500, { message: 'Database update failed' });
    }
  }
};
