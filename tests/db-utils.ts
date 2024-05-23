import fs from 'node:fs'
import { faker } from '@faker-js/faker'
import { type Player, type PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { UniqueEnforcer } from 'enforce-unique'

const uniquePlayerNameEnforcer = new UniqueEnforcer()

export function createPlayer() {
	const firstName = faker.person.firstName()
	const lastName = faker.person.lastName()

	const username = uniquePlayerNameEnforcer
		.enforce(() => {
			return (
				faker.string.alphanumeric({ length: 2 }) +
				'_' +
				faker.internet.userName({
					firstName: firstName.toLowerCase(),
					lastName: lastName.toLowerCase(),
				})
			)
		})
		.slice(0, 20)
		.toLowerCase()
		.replace(/[^a-z0-9_]/g, '_')
	return {
		type: 'player',
		firstName,
		lastName,
		email: `${username}@example.com`,
		address: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()} ${faker.location.zipCode()}`,
		dob: faker.date.birthdate(),
		phNo: faker.phone.number(),
		healthCard: faker.datatype.boolean(),
		playingRole: faker.helpers.arrayElement([
			'batsman',
			'bowler',
			'allrounder',
			'wicketkeeper',
		]),
		tshirtSize: faker.helpers.arrayElement(['sm', 'md', 'xl', '2xl']),
		batsmanRating: faker.number.int({ min: 0, max: 10 }),
		handedBatsman: faker.helpers.arrayElement(['right-handed', 'left-handed']),
		battingComment: faker.lorem.sentence(),
		bowlerRating: faker.number.int({ min: 0, max: 10 }),
		armBowler: faker.helpers.arrayElement(['right-arm', 'left-arm']),
		typeBowler: faker.helpers.arrayElement(['fast', 'medium', 'spin']),
		bowlingComment: faker.lorem.sentence(),
		fielderRating: faker.number.int({ min: 0, max: 10 }),
		fielderComment: faker.lorem.sentence(),
	} satisfies Omit<
		Player,
		'id' | 'createdAt' | 'updatedAt' | 'imageId' | 'teamId' | 'soldFor'
	>
}

export function createPassword(password: string = faker.internet.password()) {
	return {
		hash: bcrypt.hashSync(password, 10),
	}
}

let playerImages: Array<Awaited<ReturnType<typeof img>>> | undefined
export async function getPlayerImages() {
	if (playerImages) return playerImages

	playerImages = await Promise.all(
		Array.from({ length: 10 }, (_, index) =>
			img({ filepath: `./tests/fixtures/images/player/${index}.jpg` }),
		),
	)

	return playerImages
}

export async function img({
	altText,
	filepath,
}: {
	altText?: string
	filepath: string
}) {
	return {
		altText,
		contentType: filepath.endsWith('.png') ? 'image/png' : 'image/jpeg',
		blob: await fs.promises.readFile(filepath),
	}
}

export async function cleanupDb(prisma: PrismaClient) {
	const tables = await prisma.$queryRaw<
		{ name: string }[]
	>`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_migrations';`

	await prisma.$transaction([
		// Disable FK constraints to avoid relation conflicts during deletion
		prisma.$executeRawUnsafe(`PRAGMA foreign_keys = OFF`),
		// Delete all rows from each table, preserving table structures
		...tables.map(({ name }) =>
			prisma.$executeRawUnsafe(`DELETE from "${name}"`),
		),
		prisma.$executeRawUnsafe(`PRAGMA foreign_keys = ON`),
	])
}
