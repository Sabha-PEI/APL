import { prisma } from '#app/utils/db.server.ts'
import {
	cleanupDb,
	createPassword,
	createPlayer,
	getPlayerImages,
	img,
} from '#tests/db-utils.ts'

async function seed() {
	console.log('🌱 Seeding...')
	console.time(`🌱 Database has been seeded`)

	console.time('🧹 Cleaned up the database...')
	await cleanupDb(prisma)
	console.timeEnd('🧹 Cleaned up the database...')

	const totalPlayers = 5
	console.time(`👤 Created ${totalPlayers} players...`)
	const playerImages = await getPlayerImages()

	for (let index = 0; index < totalPlayers; index++) {
		const playerData = createPlayer()
		await prisma.player
			.create({
				select: { id: true },
				data: {
					...playerData,
					password: { create: createPassword(playerData.email) },
					image: { create: playerImages[index % playerImages.length] },
				},
			})
			.catch(e => {
				console.error('Error creating a player:', e)
				return null
			})
	}
	console.timeEnd(`👤 Created ${totalPlayers} players...`)

	console.time(`👑 Created admin player "Admin"`)

	await prisma.player.create({
		select: { id: true },
		data: {
			...createPlayer(),
			email: 'admin@email.com',
			firstName: 'Admin',
			lastName: 'Admin',
			image: {
				create: await img({
					filepath: './tests/fixtures/images/player/kody.png',
				}),
			},
			password: { create: createPassword('password') },
		},
	})
	console.timeEnd(`👑 Created admin player "Admin"`)

	console.timeEnd(`🌱 Database has been seeded`)
}

seed()
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
