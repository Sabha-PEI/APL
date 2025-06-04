import { redirect } from '@remix-run/node'
import type { LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData, useNavigate } from '@remix-run/react'
import { useCallback, useEffect } from 'react'
import { getPlayerById, getTeamById } from '#app/services/backend/api'
import type {
	Team as TeamType,
	Player as PlayerType,
} from '#app/services/backend/types'
import { requirePlayerId } from '#app/utils/auth.server'
import { cn } from '#app/utils/misc'
import { CURRENT_PLAYER_ID_KEY, NEXT_PLAYER_VALUE } from './auction_.panel'

export async function loader({ request }: LoaderFunctionArgs) {
	await requirePlayerId(request)

	const url = new URL(request.url)
	const id = url.searchParams.get('id')
	const teamId = url.searchParams.get('teamId')
	if (!id || !teamId) {
		console.log('no id or teamId', id, teamId)
		throw redirect('/admin/auction')
	}

	const playerPromise = getPlayerById(id)
	const teamPromise = getTeamById(teamId)

	const [player, team] = await Promise.all([playerPromise, teamPromise])

	console.log('player', player)
	console.log('team', team)

	return {
		player,
		team,
	}
}

export default function Sold() {
	const { player, team } = useLoaderData<typeof loader>()
	const navigate = useNavigate()
	// TODO: Add confetti if possible

	const handleStorageChange = useCallback(() => {
		const currentPlayerId = localStorage.getItem(CURRENT_PLAYER_ID_KEY)
		if (currentPlayerId === NEXT_PLAYER_VALUE) {
			navigate('/admin/auction')
		}
	}, [navigate])

	useEffect(() => {
		window.addEventListener('storage', handleStorageChange)

		return () => {
			window.removeEventListener('storage', handleStorageChange)
		}
	}, [handleStorageChange])

	return (
		<main className="container flex flex-1 flex-col items-center justify-center py-20">
			<h1 className="animate-slide-top text-4xl font-bold [animation-fill-mode:backwards]">
				Bhulku {player.name} sold!
			</h1>
			<p className="mt-2 animate-slide-top text-3xl [animation-delay:0.2s] [animation-fill-mode:backwards]">
				Bhulku {player.name} sold for{' '}
				<span className="underline">${player.playerSoldAmount}</span> to{' '}
				<span className="underline">{team.teamName}</span>.
			</p>
			<div className="mt-8 flex h-full items-center justify-center gap-8">
				<Team team={team} selectedPlayerId={player.id.toString()} index={0} />
			</div>
		</main>
	)
}
export function Team({
	team,
	selectedPlayerId,
	index,
}: {
	team: TeamType
	selectedPlayerId?: string
	index: number
}) {
	const players = team.players.filter(
		player =>
			player.typeof === 'player' && player.id.toString() !== selectedPlayerId,
	)
	const selectedPlayer = team.players.find(
		player => player.id.toString() === selectedPlayerId,
	)
	const captain = team.players.find(player => player.typeof === 'captain')
	const viceCaptain = team.players.find(
		player => player.typeof === 'vice-captain',
	)
	if (!captain || !viceCaptain) {
		throw new Error('No captain or vice captain found for this team')
	}

	return (
		<div className="flex h-full flex-col items-center justify-start rounded-3xl bg-accent pb-4 text-center shadow-md">
			<div
				className="animate-roll-reveal duration-500 [animation-fill-mode:backwards]"
				style={{ animationDelay: `${index * 0.14}s` }}
			>
				<img
					src={team.teamImageUrl}
					alt={team.teamName}
					className="aspect-square size-96"
				/>
			</div>
			<div className="mt-5 flex w-full flex-col divide-y px-4">
				<Player
					player={captain}
					index={0}
					selected={false}
					className="font-bold"
				/>
				<Player
					player={viceCaptain}
					index={1}
					selected={false}
					className="font-bold"
				/>
				{players.map((player, index) => (
					<Player
						key={player.id}
						player={player}
						index={index + 2}
						selected={false}
					/>
				))}
				{selectedPlayer ? (
					<Player
						player={selectedPlayer}
						index={players.length + 2}
						selected={true}
					/>
				) : null}
			</div>
		</div>
	)
}

export function Player({
	player,
	selected,
	index,
	className,
}: {
	player: PlayerType
	selected: boolean
	index: number
	className?: string
}) {
	const playerIndex = player.typeof === 'player' && index - 1

	return (
		<div
			className={cn(
				'flex animate-slide-top justify-between border-muted-foreground p-2 [animation-delay:0.2s] [animation-fill-mode:backwards]',
				selected && 'rounded-xl bg-muted-foreground text-accent',
				className,
			)}
			style={{ animationDelay: `${index * 0.14}s` }}
		>
			<p className="capitalize">
				{player.typeof} {playerIndex}
			</p>
			<h3>{player.name}</h3>
		</div>
	)
}
