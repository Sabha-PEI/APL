import { redirect, type LoaderFunctionArgs } from '@remix-run/node'
import { requirePlayerId } from '../../utils/auth.server'
import { prisma } from '../../utils/db.server'

export async function loader({ request }: LoaderFunctionArgs) {
	await requirePlayerId(request)

	const playerIds = await prisma.player.findMany({
		where: { paid: true, type: 'player' },
		select: { id: true },
	})

	if (playerIds.length !== 0) {
		return redirect('/admin/auction')
	}

	return null
}

export default function AuctionFinish() {
	return (
		<main className="container flex flex-1 flex-col place-items-center">
			<h1 className="text-4xl font-bold">All players have been sold!</h1>
		</main>
	)
}
