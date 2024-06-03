import type {Password, Player} from '@prisma/client';
import { redirect } from '@remix-run/node'
import bcrypt from 'bcryptjs'
import { safeRedirect } from 'remix-utils/safe-redirect'
import { prisma } from './db.server.ts'
import { combineHeaders } from './misc.tsx'
import { authSessionStorage } from './session.server.ts'

export const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30
export const getSessionExpirationDate = () =>
	new Date(Date.now() + SESSION_EXPIRATION_TIME)

export const sessionKey = 'sessionId'

export async function getPlayerId(request: Request) {
	const authSession = await authSessionStorage.getSession(
		request.headers.get('cookie'),
	)
	const sessionId = authSession.get(sessionKey)
	if (!sessionId) return null
	const session = await prisma.session.findUnique({
		select: { player: { select: { id: true } } },
		where: { id: sessionId, expirationDate: { gt: new Date() } },
	})
	if (!session?.player) {
		throw redirect('/', {
			headers: {
				'set-cookie': await authSessionStorage.destroySession(authSession),
			},
		})
	}
	return session.player.id
}

export async function requirePlayerId(
	request: Request,
	{ redirectTo }: { redirectTo?: string | null } = {},
) {
	const playerId = await getPlayerId(request)
	if (!playerId) {
		const requestUrl = new URL(request.url)
		redirectTo =
			redirectTo === null
				? null
				: redirectTo ?? `${requestUrl.pathname}${requestUrl.search}`
		const loginParams = redirectTo ? new URLSearchParams({ redirectTo }) : null
		const loginRedirect = ['/login', loginParams?.toString()]
			.filter(Boolean)
			.join('?')
		throw redirect(loginRedirect)
	}
	return playerId
}

export async function requireAnonymous(request: Request) {
	const playerId = await getPlayerId(request)
	if (playerId) {
		throw redirect('/')
	}
}

export async function login({
	email,
	password,
}: {
	email: Player['email']
	password: string
}) {
	const player = await verifyPlayerPassword({ email }, password)
	if (!player) return null
	const session = await prisma.session.create({
		select: { id: true, expirationDate: true, playerId: true },
		data: {
			expirationDate: getSessionExpirationDate(),
			playerId: player.id,
		},
	})
	return session
}

export async function logout(
	{
		request,
		redirectTo = '/',
	}: {
		request: Request
		redirectTo?: string
	},
	responseInit?: ResponseInit,
) {
	const authSession = await authSessionStorage.getSession(
		request.headers.get('cookie'),
	)
	const sessionId = authSession.get(sessionKey)
	// if this fails, we still need to delete the session from the user's browser
	// and it doesn't do any harm staying in the db anyway.
	if (sessionId) {
		// the .catch is important because that's what triggers the query.
		// learn more about PrismaPromise: https://www.prisma.io/docs/orm/reference/prisma-client-reference#prismapromise-behavior
		void prisma.session.deleteMany({ where: { id: sessionId } }).catch(() => {})
	}
	throw redirect(safeRedirect(redirectTo), {
		...responseInit,
		headers: combineHeaders(
			{ 'set-cookie': await authSessionStorage.destroySession(authSession) },
			responseInit?.headers,
		),
	})
}

export async function getPasswordHash(password: string) {
	const hash = await bcrypt.hash(password, 10)
	return hash
}

export async function verifyPlayerPassword(
	where: Pick<Player, 'email'> | Pick<Player, 'id'>,
	password: Password['hash'],
) {
	const playerWithPassword = await prisma.player.findUnique({
		where,
		select: { id: true, password: { select: { hash: true } } },
	})

	if (!playerWithPassword || !playerWithPassword.password) {
		return null
	}

	const isValid = await bcrypt.compare(
		password,
		playerWithPassword.password.hash,
	)

	if (!isValid) {
		return null
	}

	return { id: playerWithPassword.id }
}
