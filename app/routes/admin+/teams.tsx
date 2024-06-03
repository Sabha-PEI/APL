import type { LoaderFunctionArgs, SerializeFrom } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { requirePlayerId } from '../../utils/auth.server'
import { prisma } from '../../utils/db.server'
import { getTeamImgSrc } from '../../utils/misc'

export async function loader({ request }: LoaderFunctionArgs) {
	await requirePlayerId(request)

	const teams = await prisma.team.findMany({
		select: {
			id: true,
			name: true,
			image: {
				select: {
					id: true,
				},
			},
		},
	})

	return { teams }
}

export default function Teams() {
	const { teams } = useLoaderData<typeof loader>()

	return (
		<main className="container flex flex-1 flex-col place-items-center">
			<h1 className="text-4xl font-bold">Teams</h1>
			<Link to="/admin/teams/new" className="mt-3 hover:underline">
				Create Team
			</Link>
			<ul className="mt-5 flex flex-wrap gap-5">
				{teams.map(team => (
					<Team key={team.id} team={team} />
				))}
			</ul>
		</main>
	)
}

type TeamProps = {
	team: SerializeFrom<typeof loader>['teams'][number]
}
function Team({ team }: TeamProps) {
	const teamImgSrc = getTeamImgSrc(team.image.id)

	return (
		<li className="rounded-lg border border-accent-foreground/40">
			<img
				src={teamImgSrc}
				alt={team.name}
				className="mx-auto aspect-auto size-32"
			/>
			<div className="flex flex-col items-center justify-center gap-3 px-3 py-2">
				<h2>{team.name}</h2>
			</div>
		</li>
	)
}
