import { test as base } from '@playwright/test'
import { type Player as PlayerModel } from '@prisma/client'
import * as setCookieParser from 'set-cookie-parser'
import {
	getPasswordHash,
	getSessionExpirationDate,
	sessionKey,
} from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { authSessionStorage } from '#app/utils/session.server.ts'
import { createPlayer, img } from './db-utils.ts'

export * from './db-utils.ts'

type GetOrInsertPlayerOptions = {
	id?: string
	password?: string
	email?: PlayerModel['email']
}

type Player = {
	id: string
	email: string
	firstName: string
	lastName: string
}

async function getOrInsertPlayer({
	id,
	password,
	email,
}: GetOrInsertPlayerOptions = {}): Promise<Player> {
	const select = { id: true, email: true, firstName: true, lastName: true }
	if (id) {
		return await prisma.player.findUniqueOrThrow({
			select,
			where: { id: id },
		})
	} else {
		const playerData = createPlayer()
		password ??= playerData.email
		email ??= playerData.email
		return await prisma.player.create({
			select,
			data: {
				...playerData,
				email,
				password: { create: { hash: await getPasswordHash(password) } },
				image: {
					create: await img({
						filepath: './tests/fixtures/images/player/kody.png',
					}),
				},
			},
		})
	}
}

export const test = base.extend<{
	insertNewPlayer(options?: GetOrInsertPlayerOptions): Promise<Player>
	login(options?: GetOrInsertPlayerOptions): Promise<Player>
}>({
	insertNewPlayer: async ({}, use) => {
		let playerId: string | undefined = undefined
		await use(async options => {
			const player = await getOrInsertPlayer(options)
			playerId = player.id
			return player
		})
		await prisma.player.delete({ where: { id: playerId } }).catch(() => {})
	},
	login: async ({ page }, use) => {
		let playerId: string | undefined = undefined
		await use(async options => {
			const player = await getOrInsertPlayer(options)
			playerId = player.id
			const session = await prisma.session.create({
				data: {
					expirationDate: getSessionExpirationDate(),
					playerId: player.id,
				},
				select: { id: true },
			})

			const authSession = await authSessionStorage.getSession()
			authSession.set(sessionKey, session.id)
			const cookieConfig = setCookieParser.parseString(
				await authSessionStorage.commitSession(authSession),
			) as any
			await page
				.context()
				.addCookies([{ ...cookieConfig, domain: 'localhost' }])
			return player
		})
		await prisma.player.deleteMany({ where: { id: playerId } })
	},
})
export const { expect } = test

/**
 * This allows you to wait for something (like an email to be available).
 *
 * It calls the callback every 50ms until it returns a value (and does not throw
 * an error). After the timeout, it will throw the last error that was thrown or
 * throw the error message provided as a fallback
 */
export async function waitFor<ReturnValue>(
	cb: () => ReturnValue | Promise<ReturnValue>,
	{
		errorMessage,
		timeout = 5000,
	}: { errorMessage?: string; timeout?: number } = {},
) {
	const endTime = Date.now() + timeout
	let lastError: unknown = new Error(errorMessage)
	while (Date.now() < endTime) {
		try {
			const response = await cb()
			if (response) return response
		} catch (e: unknown) {
			lastError = e
		}
		await new Promise(r => setTimeout(r, 100))
	}
	throw lastError
}
