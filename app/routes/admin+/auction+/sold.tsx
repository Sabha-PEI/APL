import { invariantResponse } from '@epic-web/invariant'
import type { LoaderFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { Button } from '../../../components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '../../../components/ui/dialog'

import { requirePlayerId } from '../../../utils/auth.server'
import { prisma } from '../../../utils/db.server'

export async function loader({ request }: LoaderFunctionArgs) {
	await requirePlayerId(request)
	const url = new URL(request.url)
	const id = url.searchParams.get('id')
	invariantResponse(id, 'Player ID is required', { status: 400 })
	const player = await prisma.player.findUnique({
		where: { id },
		select: {
			firstName: true,
			lastName: true,
			soldFor: true,
			team: {
				select: { name: true },
			},
		},
	})

	invariantResponse(player, 'Player not found', { status: 404 })

	return { player }
}

export default function Sold() {
	const { player } = useLoaderData<typeof loader>()

	return (
		<Dialog open>
			<DialogContent className="sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle className="text-h1">Player sold!</DialogTitle>
					<DialogDescription className="pt-6 text-3xl">
						Bhulku {player.firstName} {player.lastName} has been sold for $
						{player.soldFor} to {player.team?.name}.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="mt-10">
					<Button>
						<Link to="/admin/auction">Next</Link>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
