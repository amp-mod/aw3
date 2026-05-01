import { hash } from '@node-rs/argon2';
import { fail, redirect } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import { verifySolution } from 'altcha-lib';
import { hmacKey } from '$lib/server/hmac';
import { eq, sql } from 'drizzle-orm';
import { isProfane } from '$lib/server/bad-word-checker';
import { generateVerificationData, findVerificationToken } from '$lib/server/scratch-verify';

export const load: PageServerLoad = async (event) => {
    if (event.locals.user) {
        return redirect(302, '/');
    }

    const scratchUsername = event.cookies.get('s_reg_user');
    const token = event.cookies.get('s_reg_token');
    const comment = event.cookies.get('s_reg_comment');

    return {
        isNew: event.locals.isNewAw3,
        scratchStep: scratchUsername ? 2 : 1,
        scratchUsername,
        verificationToken: token,
        verificationComment: comment
    };
};

export const actions: Actions = {
    register: async (event) => {
        const formData = await event.request.formData();
        // Normalize to lowercase immediately
        const username = (formData.get('username') as string)?.toLowerCase().trim() ?? '';
        const password = formData.get('password');

        if (!validateUsername(username) || isProfane(username, true)) {
            return fail(400, { message: 'Invalid username' });
        }
        if (!validatePassword(password)) {
            return fail(400, { message: 'Invalid password' });
        }

        const altchaPayload = formData.get('altcha');
        if (!altchaPayload || typeof altchaPayload !== 'string') {
            return fail(400, { message: 'Missing CAPTCHA payload' });
        }

        const ok = await verifySolution(altchaPayload, hmacKey);
        if (!ok) return fail(400, { message: 'CAPTCHA failed' });

        const passwordHash = await hash(password as string, {
            memoryCost: 19456,
            timeCost: 2,
            outputLen: 32,
            parallelism: 1,
        });

        try {
            const result = await createNewUser(username, passwordHash);
            if ('error' in result) return fail(result.status, { message: result.error });

            await establishSession(event, result.newUser.id);
        } catch (e) {
            console.error(e);
            return fail(500, { message: 'An error occurred during registration' });
        }

        return redirect(302, '/');
    },

    registerScratch: async ({ request, cookies }) => {
        const formData = await request.formData();
        // Normalize to lowercase immediately
        const username = formData.get('username')?.toString().toLowerCase().trim() ?? '';
        const password = formData.get('password')?.toString() ?? '';

        if (!validateUsername(username) || isProfane(username, true)) {
            return fail(400, { message: 'Invalid username' });
        }
        if (!validatePassword(password)) {
            return fail(400, { message: 'Invalid password' });
        }

        const existing = await db.query.user.findFirst({
            where: sql`${table.user.username} = ${username} OR (${table.user.scratchUsername} = ${username} AND ${table.user.scratchLinked} = true)`
        });
        if (existing) return fail(400, { message: 'Username or Scratch account already in use' });

        const res = await fetch(`https://api.scratch.mit.edu/users/${username}`);
        if (!res.ok) return fail(404, { message: 'Scratch user not found' });
        const scratchData = await res.json();
        if (scratchData.scratchteam) {
            return fail(403, { message: 'Scratch Team members must contact support.' });
        }

        const { token, fullComment } = generateVerificationData();
        const passwordHash = await hash(password, { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 });

        const opts = { path: '/', maxAge: 1800, httpOnly: true, secure: true, sameSite: 'lax' as const };
        cookies.set('s_reg_user', username, opts);
        cookies.set('s_reg_token', token, opts);
        cookies.set('s_reg_comment', fullComment, opts);
        cookies.set('s_reg_pw', passwordHash, opts);

        return { 
            scratchStep: 2, 
            scratchUsername: username, 
            verificationToken: token, 
            verificationComment: fullComment 
        };
    },

    verifyScratch: async (event) => {
        const { cookies } = event;
        const username = cookies.get('s_reg_user'); // Already lowercased from Step 1
        const expectedToken = cookies.get('s_reg_token');
        const passwordHash = cookies.get('s_reg_pw');

        if (!username || !expectedToken || !passwordHash) {
            return fail(400, { message: 'Session expired. Please start over.' });
        }

        try {
            const foundToken = await findVerificationToken(username);
            if (!foundToken || foundToken !== expectedToken) {
                return fail(400, { message: 'Verification failed. Could not find the comment.' });
            }

            const result = await createNewUser(username, passwordHash, true);
            if ('error' in result) return fail(result.status, { message: result.error });

            await establishSession(event, result.newUser.id);
            clearScratchCookies(cookies);
        } catch (e) {
            console.error(e);
            return fail(500, { message: 'Finalization failed.' });
        }

        return redirect(302, '/');
    },

    resetScratch: async ({ cookies }) => {
        clearScratchCookies(cookies);
        return { scratchStep: 1 };
    },

    checkUsername: async ({ request }) => {
        const formData = await request.formData();
        const username = (formData.get('username') as string)?.toLowerCase().trim() ?? '';

        if (isProfane(username, true)) {
            return { available: false, message: 'Username is profane.' };
        }
        if (!validateUsername(username)) {
            return {
                available: false,
                message: 'Usernames must be 3-20 characters (lowercase, numbers, underscores, dashes).',
            };
        }

        const existingUser = await db
            .select({ id: table.user.id })
            .from(table.user)
            .where(eq(table.user.username, username))
            .limit(1);

        return { available: existingUser.length === 0, message: existingUser.length > 0 ? 'Username taken.' : '' };
    },
};

// --- PRIVATE HELPERS ---

async function createNewUser(username: string, passwordHash: string, isScratch = false) {
    return await db.transaction(async (tx) => {
        const existing = await tx
            .select({ id: table.user.id })
            .from(table.user)
            .where(eq(table.user.username, username))
            .limit(1);

        if (existing.length > 0) return { error: 'Username already exists', status: 409 };

        const userCount = await tx.select({ count: sql<number>`count(*)` }).from(table.user);
        const assignedRank = Number(userCount[0].count) === 0 ? 3 : 0;

        const [newUser] = await tx.insert(table.user).values({
            username, // Already normalized
            passwordHash,
            rank: assignedRank,
            scratchUsername: isScratch ? username : null,
            scratchLinked: isScratch,
        }).returning({ id: table.user.id });

        return { newUser, status: 200 };
    });
}

async function establishSession(event: any, userId: string) {
    const sessionToken = auth.generateSessionToken();
    const session = await auth.createSession(
        sessionToken,
        userId,
        event.getClientAddress(),
        event.request.headers.get('user-agent'),
    );
    auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
}

function clearScratchCookies(cookies: any) {
    const opts = { path: '/' };
    cookies.delete('s_reg_user', opts);
    cookies.delete('s_reg_token', opts);
    cookies.delete('s_reg_comment', opts);
    cookies.delete('s_reg_pw', opts);
}

function validateUsername(username: string): boolean {
    // Only lowercase allowed post-normalization
    return (
        username.length >= 3 &&
        username.length <= 20 &&
        /^[a-z0-9_-]+$/.test(username)
    );
}

function validatePassword(password: unknown): password is string {
    return typeof password === 'string' && password.length >= 6 && password.length <= 255;
}