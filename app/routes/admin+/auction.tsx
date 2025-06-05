import type { LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData, useNavigate } from '@remix-run/react'
import { useCallback, useEffect } from 'react'
import { CircularProgress } from '#app/components/circular-progress'
import { getPlayerById, getRandomPlayer } from '#app/services/backend/api'
import { requirePlayerId } from '#app/utils/auth.server'
import { redirectWithConfetti } from '#app/utils/confetti.server'
import { cn, tryCatch } from '#app/utils/misc'
import { redirectWithToast } from '#app/utils/toast.server'
import { CURRENT_PLAYER_ID_KEY, CURRENT_TEAM_ID_KEY } from './auction_.panel'

export async function loader({ request }: LoaderFunctionArgs) {
	await requirePlayerId(request)

	const url = new URL(request.url)
	const id = url.searchParams.get('id')

	if (id) {
		const { data: player, error: getPlayerByIdError } = await tryCatch(
			getPlayerById(id),
		)
		if (getPlayerByIdError) {
			console.log('auction.loader getPlayerByIdError', getPlayerByIdError)
			throw redirectWithToast('/admin/auction', {
				description: `Player with id ${id} not found`,
				type: 'error',
			})
		}
		return { player }
	}

	const { data: randomPlayer, error: randomPlayerError } =
		await tryCatch(getRandomPlayer())

	if (randomPlayerError) {
		console.log('auction.loader randomPlayerError', randomPlayerError)
		throw redirectWithToast('/admin/auction', {
			description: 'Error fetching random player',
			type: 'error',
		})
	}
	if (
		randomPlayer.id === 0 ||
		randomPlayer.name === 'No unsold players available'
	) {
		return redirectWithConfetti('/admin/auction/finish')
	}

	return { player: randomPlayer }
}

export default function Auction() {
	const { player } = useLoaderData<typeof loader>()
	const navigate = useNavigate()

	const handleStorageChange = useCallback(() => {
		const playerId = localStorage.getItem(CURRENT_PLAYER_ID_KEY)
		const teamId = localStorage.getItem(CURRENT_TEAM_ID_KEY)
		if (!playerId || playerId !== player.id.toString() || !teamId) {
			navigate(`/admin/auction/sold?id=${player.id}&teamId=${teamId}`)
		}
	}, [player.id, navigate])

	useEffect(() => {
		window.addEventListener('storage', handleStorageChange)

		return () => {
			window.removeEventListener('storage', handleStorageChange)
		}
	}, [handleStorageChange])

	useEffect(() => {
		localStorage.setItem(CURRENT_PLAYER_ID_KEY, player.id.toString())
	}, [player.id])

	return (
		<main className="flex-1 bg-[#1E1F21]">
			<div className="grid h-screen grid-cols-3 gap-8 p-6">
				<Card className="flex flex-col items-center justify-evenly gap-6 text-center">
					<div
						style={{
							backgroundImage: `url(${player.playerImageUrl})`,
							backgroundSize: 'cover',
							backgroundPosition: 'top',
						}}
						className="mx-auto aspect-square flex-grow overflow-hidden rounded-full"
					/>
					<div className="flex flex-col gap-2">
						<p className="text-h3">{player.name}</p>
						<p className="text-h6 text-gray-400">
							{formatPhNo(player.phone.toString())}
						</p>
						<p className="text-h6 text-gray-400">{player.email}</p>
					</div>
				</Card>
				<div className="col-span-2 grid grid-cols-3 gap-8">
					<Card className="flex flex-col items-center gap-4">
						{/* <div
							style={{
								backgroundImage: `url(/img/batting.png)`,
								backgroundSize: 'contain',
								backgroundRepeat: 'no-repeat',
								backgroundPosition: 'center',
							}}
							className="flex-grow"
						/> */}
						<p className="mb-2 text-2xl font-bold">Batting Rating</p>
						<CircularProgress value={player.battingRating} />
					</Card>
					<Card className="flex flex-col items-center gap-4">
						{/* <div
							style={{
								backgroundImage: `url(/img/bowling.png)`,
								backgroundSize: 'contain',
								backgroundRepeat: 'no-repeat',
								backgroundPosition: 'center',
							}}
							className="flex-grow"
						/> */}
						<p className="mb-2 text-2xl font-bold">Bowling Rating</p>
						<CircularProgress value={player.bowlingRating} />
					</Card>
					<Card className="flex flex-col items-center gap-4">
						{/* <div
							style={{
								backgroundImage: `url(/img/fielding.png)`,
								backgroundSize: 'contain',
								backgroundRepeat: 'no-repeat',
								backgroundPosition: 'center',
							}}
							className="flex-grow"
						/> */}
						<p className="mb-2 text-2xl font-bold">Fielding Rating</p>
						<CircularProgress value={player.fieldingRating} />
					</Card>
					<Card className="flex flex-col items-center justify-center gap-2 text-2xl font-bold">
						<p>Matches</p>
						<p>{player.noOfMatches}</p>
					</Card>
					<Card className="flex flex-col items-center justify-center gap-2 text-2xl font-bold">
						<p>Runs</p>
						<p>{player.noOfRuns}</p>
					</Card>
					<Card className="flex flex-col items-center justify-center gap-2 text-2xl font-bold">
						<p>Strike Rate</p>
						<p>{player.strikeRate}</p>
					</Card>
					<Card className="flex flex-col items-center justify-center gap-2 text-2xl font-bold">
						<p>Dismissal</p>
						<p>{player.noOfDismissals}</p>
					</Card>
					<Card className="flex flex-col items-center justify-center gap-2 text-2xl font-bold">
						<p>Catches</p>
						<p>{player.noOfCatches}</p>
					</Card>
					<Card className="flex flex-col items-center justify-center gap-2 text-2xl font-bold">
						<p>Wickets</p>
						<p>{player.noOfWickets}</p>
					</Card>
				</div>
			</div>
		</main>
	)
}

function Card({
	children,
	className,
}: {
	children: React.ReactNode
	className?: string
}) {
	return (
		<div
			className={cn('neu-button overflow-hidden rounded-3xl p-4', className)}
		>
			{children}
		</div>
	)
}

function formatPhNo(phNo: string) {
	return phNo.replace(/\s/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
}
