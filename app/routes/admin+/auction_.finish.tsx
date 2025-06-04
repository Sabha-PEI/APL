import { redirect } from '@remix-run/node'
import type { LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { getAllTeams, getRandomPlayer } from '#app/services/backend/api'
import { requirePlayerId } from '#app/utils/auth.server'
import { tryCatch } from '#app/utils/misc'
import { redirectWithToast } from '#app/utils/toast.server'
import { Team } from './auction_.sold'

export async function loader({ request }: LoaderFunctionArgs) {
	await requirePlayerId(request)

	const { data: randomPlayer, error: randomPlayerError } =
		await tryCatch(getRandomPlayer())

	if (randomPlayerError) {
		console.log('auction.finish.loader randomPlayerError', randomPlayerError)
		throw redirectWithToast('/admin/auction', {
			description: 'Error fetching random player',
			type: 'error',
		})
	}

	if (randomPlayer) {
		return redirect('/admin/auction')
	}

	const { data: teams, error: teamsError } = await tryCatch(getAllTeams())
	if (teamsError) {
		console.log('auction.finish.loader teamsError', teamsError)
		throw redirectWithToast('/admin/auction', {
			description: 'Error fetching all teams',
			type: 'error',
		})
	}

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
