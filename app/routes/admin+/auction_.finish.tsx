import { redirect } from '@remix-run/node'
import type { LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { requirePlayerId } from '../../utils/auth.server'
import { prisma } from '../../utils/db.server'
import { Team } from './auction_.sold'

export async function loader({ request }: LoaderFunctionArgs) {
	await requirePlayerId(request)

	const playerIds = await prisma.player.findMany({
		where: { paid: true, type: 'player' },
		select: { id: true },
	})

	if (playerIds.length !== 0) {
		return redirect('/admin/auction')
	}

	const teams = await prisma.team.findMany({
		select: {
			name: true,
			players: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					type: true,
				},
			},
			imageId: true,
		},
	})

	return { teams }
}

export default function AuctionFinish() {
	const { teams } = useLoaderData<typeof loader>()

	return (
		<main className="container flex flex-1 flex-col items-center justify-center py-20">
			<h1 className="text-4xl font-bold">All players have been sold!</h1>
			<div className="mt-8 grid h-full grid-cols-3 items-center justify-center gap-8">
				{teams.map((team, index) => (
					<Team key={team.name} team={team} index={index} />
				))}
			</div>
		</main>
	)
}
