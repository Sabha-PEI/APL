import type { MetaFunction } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { Button } from '../../components/ui/button'
import { prisma } from '../../utils/db.server'
import { getTeamImgSrc } from '../../utils/misc'
import { useOptionalPlayer } from '../../utils/player'

export const meta: MetaFunction = () => [{ title: 'APL PEI 2024' }]

export async function loader() {
	const teams = await prisma.team.findMany({
		select: {
			name: true,
			imageId: true,
		},
	})
	return { teams }
}

export default function Index() {
	const { teams } = useLoaderData<typeof loader>()
	const player = useOptionalPlayer()

	return (
		<main className="container flex h-full flex-1 flex-col place-items-center pb-28">
			<img
				src="/img/logo.png"
				alt="APL PEI 2024"
				className="w-56 animate-slide-top [animation-fill-mode:backwards]"
			/>
			<h1 className="animate-slide-top text-4xl font-bold [animation-delay:0.3s] [animation-fill-mode:backwards]">
				APL PEI 2024
			</h1>
			<Button
				className="mt-4 animate-slide-top [animation-delay:0.6s] [animation-fill-mode:backwards]"
				asChild
			>
				{player ? (
					<Link to="/admin">Admin</Link>
				) : (
					<Link to="/registration">Register</Link>
				)}
			</Button>
			<div className="mt-8 flex flex-wrap items-center justify-center gap-8">
				{teams.map((team, index) => (
					<div
						key={team.name}
						className="animate-roll-reveal rounded-3xl bg-accent text-center shadow-md duration-500 [animation-fill-mode:backwards] hover:-translate-y-3"
						style={{ animationDelay: `${index * 0.14}s` }}
					>
						<img
							src={getTeamImgSrc(team.imageId)}
							alt={team.name}
							className="aspect-square size-96"
						/>
					</div>
				))}
			</div>
		</main>
	)
}
