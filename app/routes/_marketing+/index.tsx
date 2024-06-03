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
		<div className="mt-128 container flex h-full flex-1 flex-col place-items-center">
			<img src="/img/logo.png" alt="APL PEI 2024" className="w-56" />
			<h1 className="text-4xl font-bold">APL PEI 2024</h1>
			{player ? (
				<Button className="mt-4" asChild>
					<Link to="/admin">Admin</Link>
				</Button>
			) : (
				<Button className="mt-4" asChild>
					<Link to="/registration">Register</Link>
				</Button>
			)}
			<div className="mt-8 grid grid-cols-4">
				{teams.map(team => (
					<div key={team.name}>
						<img
							src={getTeamImgSrc(team.imageId)}
							alt={team.name}
							className="w-24"
						/>
						<h2>{team.name}</h2>
					</div>
				))}
			</div>
		</div>
	)
}
