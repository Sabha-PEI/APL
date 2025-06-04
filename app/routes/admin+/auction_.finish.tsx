import { redirect } from '@remix-run/node'
import type { LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { getAllTeams, getRandomPlayer } from '#app/services/backend/api'
import { requirePlayerId } from '#app/utils/auth.server'
import { Team } from './auction_.sold'

export async function loader({ request }: LoaderFunctionArgs) {
	await requirePlayerId(request)

	const randomPlayer = await getRandomPlayer()

	if (randomPlayer) {
		return redirect('/admin/auction')
	}

	const teams = await getAllTeams()

	return { teams }
}

export default function AuctionFinish() {
	const { teams } = useLoaderData<typeof loader>()

	return (
		<main className="container flex flex-1 flex-col items-center justify-center py-20">
			<h1 className="text-4xl font-bold">All players have been sold!</h1>
			<div className="mt-8 grid h-full grid-cols-3 items-center justify-center gap-8">
				{teams.map((team, index) => (
					<Team key={team.id} team={team} index={index} />
				))}
			</div>
		</main>
	)
}
