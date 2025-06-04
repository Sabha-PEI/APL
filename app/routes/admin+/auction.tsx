import type { LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData, useNavigate } from '@remix-run/react'
import { useCallback, useEffect } from 'react'
import { CircularProgress } from '#app/components/circular-progress'
import { getPlayerById, getRandomPlayer } from '#app/services/backend/api'
import { requirePlayerId } from '#app/utils/auth.server'
import { redirectWithConfetti } from '#app/utils/confetti.server'
import { cn } from '#app/utils/misc'
import { CURRENT_PLAYER_ID_KEY, CURRENT_TEAM_ID_KEY } from './auction_.panel'

export async function loader({ request }: LoaderFunctionArgs) {
	await requirePlayerId(request)

	const url = new URL(request.url)
	const id = url.searchParams.get('id')

	if (id) {
		const player = await getPlayerById(id)
		return { player }
	}

	const randomPlayer = await getRandomPlayer()

	if (!randomPlayer) {
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
			<div className="grid h-screen grid-cols-3 gap-12 p-6">
				<div className="grid grid-rows-6 gap-12">
					<Card className="row-span-4 flex flex-col items-center justify-evenly gap-6 text-center">
						<div
							style={{
								backgroundImage: `url(${player.playerImageUrl})`,
								backgroundSize: 'cover',
								backgroundPosition: 'top',
							}}
							className="mx-auto aspect-square flex-grow overflow-hidden rounded-full"
						/>
						<div className="flex flex-col gap-2">
							<p className="text-h1">{player.name}</p>
							<p className="text-h5 text-gray-400">
								{formatPhNo(player.phone.toString())}
							</p>
							<p className="text-h5 text-gray-400">{player.email}</p>
						</div>
					</Card>
					<GradientCard
						title="No of Matches"
						value={player.noOfMatches.toString()}
					/>
					<GradientCard
						title="No of Dismissal"
						value={player.noOfDismissals.toString()}
						direction="to-l"
					/>
				</div>
				<div className="col-span-2 grid grid-rows-6 gap-12">
					<div className="row-span-4 grid grid-cols-3 gap-8">
						<Card className="flex flex-col gap-4">
							<div
								style={{
									backgroundImage: `url(/img/batting.png)`,
									backgroundSize: 'contain',
									backgroundRepeat: 'no-repeat',
									backgroundPosition: 'center',
								}}
								className="flex-grow"
							/>
							<CircularProgress value={player.battingRating} />
						</Card>
						<Card className="flex flex-col gap-4">
							<div
								style={{
									backgroundImage: `url(/img/bowling.png)`,
									backgroundSize: 'contain',
									backgroundRepeat: 'no-repeat',
									backgroundPosition: 'center',
								}}
								className="flex-grow"
							/>
							<CircularProgress value={player.bowlingRating} />
						</Card>
						<Card className="flex flex-col gap-4">
							<div
								style={{
									backgroundImage: `url(/img/fielding.png)`,
									backgroundSize: 'contain',
									backgroundRepeat: 'no-repeat',
									backgroundPosition: 'center',
								}}
								className="flex-grow"
							/>
							<CircularProgress value={player.fieldingRating} />
						</Card>
					</div>
					<div className="row-span-2 grid grid-cols-2 gap-12">
						<GradientCard
							direction="to-l"
							title="No of Runs"
							value={player.noOfRuns.toString()}
						/>
						<GradientCard
							title="Strike Rate"
							value={player.strikeRate.toString()}
						/>
						<GradientCard
							title="No of Catches"
							value={player.noOfCatches.toString()}
						/>
						<GradientCard
							direction="to-l"
							title="No of Wickets"
							value={player.noOfWickets.toString()}
						/>
					</div>
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
			className={cn('overflow-hidden rounded-3xl bg-[#2B2F35] p-6', className)}
		>
			{children}
		</div>
	)
}

function GradientCard({
	title,
	value,
	direction = 'to-r',
	className,
}: {
	title: string
	value: string
	direction?: 'to-r' | 'to-l'
	className?: string
}) {
	return (
		<div
			className={cn(
				'flex flex-col items-center justify-center gap-6 rounded-3xl bg-gradient-to-r p-6 text-center text-5xl font-bold',
				direction === 'to-r' && 'from-[#F4AA61] via-[#E75E7F] to-[#C05FF4]',
				direction === 'to-l' && 'from-[#C05FF4] via-[#E75E7F] to-[#F4AA61]',
				className,
			)}
		>
			<p>{title}</p>
			<p>{value}</p>
		</div>
	)
}

function formatPhNo(phNo: string) {
	return phNo.replace(/\s/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
}
