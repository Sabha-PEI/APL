import { redirect } from '@remix-run/node'
import type { LoaderFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { Button } from '../../components/ui/button'
import { requirePlayerId } from '../../utils/auth.server'
import { prisma } from '../../utils/db.server'
import { cn, getTeamImgSrc } from '../../utils/misc'

export async function loader({ request }: LoaderFunctionArgs) {
	await requirePlayerId(request)
	const url = new URL(request.url)
	const id = url.searchParams.get('id')
	if (!id) {
		throw redirect('/admin/auction')
	}

	const teamsPromise = prisma.team.findMany({
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
	const playerPromise = prisma.player.findUnique({
		where: { id },
		select: {
			id: true,
			firstName: true,
			lastName: true,
			soldFor: true,
			team: {
				select: { name: true },
			},
		},
	})

	const [teams, player] = await Promise.all([teamsPromise, playerPromise])
	if (!player) {
		throw redirect('/admin/auction')
	}

	return {
		teams,
		player,
	}
}

export default function Sold() {
	const { teams, player } = useLoaderData<typeof loader>()

	return (
		<main className="container flex flex-1 flex-col items-center justify-center py-20">
			<h1 className="animate-slide-top text-4xl font-bold [animation-fill-mode:backwards]">
				Bhulku {player.firstName} {player.lastName} sold!
			</h1>
			<p className="mt-2 animate-slide-top text-3xl [animation-delay:0.2s] [animation-fill-mode:backwards]">
				Bhulku {player.firstName} {player.lastName} sold for{' '}
				<span className="underline">${player.soldFor}</span> to{' '}
				<span className="underline">{player.team?.name}</span>.
			</p>
			<div className="mt-8 grid h-full grid-cols-3 items-center justify-center gap-8">
				{teams.map((team, index) => (
					<Team
						key={team.name}
						team={team}
						index={index}
						selectedPlayerId={player.id}
					/>
				))}
			</div>
			<Button className="mt-5" asChild>
				<Link to="/admin/auction">Next Player</Link>
			</Button>
		</main>
	)
}

function Team({
	team,
	selectedPlayerId,
	index,
}: {
	team: Awaited<ReturnType<typeof loader>>['teams'][number]
	selectedPlayerId: string
	index: number
}) {
	const players = team.players.filter(
		player => player.type === 'player' && player.id !== selectedPlayerId,
	)
	const selectedPlayer = team.players.find(
		player => player.id === selectedPlayerId,
	)
	const captain = team.players.find(player => player.type === 'captain')
	const viceCaptain = team.players.find(
		player => player.type === 'vice captain',
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
					src={getTeamImgSrc(team.imageId)}
					alt={team.name}
					className="aspect-square size-96"
				/>
			</div>
			<div className="mt-5 flex w-full flex-col divide-y px-4">
				<Player player={captain} index={0} selected={false} />
				<Player player={viceCaptain} index={1} selected={false} />
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

function Player({
	player,
	selected,
	index,
}: {
	player: Awaited<ReturnType<typeof loader>>['teams'][number]['players'][number]
	selected: boolean
	index: number
}) {
	const playerIndex = player.type === 'player' && index - 1

	return (
		<div
			className={cn(
				'flex animate-slide-top justify-between border-muted-foreground p-2 [animation-delay:0.2s] [animation-fill-mode:backwards]',
				selected && 'rounded-xl bg-muted-foreground text-accent',
			)}
			style={{ animationDelay: `${index * 0.14}s` }}
		>
			<p className="capitalize">
				{player.type} {playerIndex}
			</p>
			<h3>
				{player.firstName} {player.lastName}
			</h3>
		</div>
	)
}
