import type { HeadersFunction, LoaderFunctionArgs } from '@remix-run/node'
import { Form, useLoaderData } from '@remix-run/react'
import { Button } from '../../components/ui/button'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '../../components/ui/table'
import { requirePlayerId } from '../../utils/auth.server'
import { prisma } from '../../utils/db.server'
import { getIframeSrc } from './index.server'

export const headers: HeadersFunction = () => {
	const iframeSrc = getIframeSrc()
	return {
		'Content-Security-Policy': `frame-src 'self' ${iframeSrc}`,
	}
}

export async function loader({ request }: LoaderFunctionArgs) {
	await requirePlayerId(request)
	const players = await prisma.player.findMany({
		select: {
			id: true,
			firstName: true,
			lastName: true,
			address: true,
			phNo: true,
			dob: true,
			healthCard: true,
			playingRole: true,
			tshirtSize: true,
			batsmanRating: true,
			handedBatsman: true,
			battingComment: true,
			bowlerRating: true,
			armBowler: true,
			typeBowler: true,
			bowlingComment: true,
			fielderRating: true,
			fielderComment: true,
			paid: true,
			paidAt: true,
		},
	})

	return { iframeSrc: getIframeSrc(), players }
}

export default function Index() {
	const { players } = useLoaderData<typeof loader>()

	return (
		<main className="mt-128 container flex flex-1 flex-col place-items-center">
			<h1 className="text-4xl font-bold">Admin Panel</h1>

			<Form method="POST" action="/logout" className="mt-3">
				<Button type="submit">Logout</Button>
			</Form>

			<div className="mt-5 flex w-full flex-1 flex-col pb-20">
				{/* <iframe
					title="Prisma Studio"
					src={iframeSrc}
					width="100%"
					height="100%"
					className="flex-1"
					allowFullScreen
				></iframe> */}
				<p className="text-center">{players.length} players registered</p>
				<Table className="mt-5 border">
					<TableHeader>
						<TableRow className="divide-x">
							<TableHead></TableHead>
							<TableHead>ID</TableHead>
							<TableHead>Paid</TableHead>
							<TableHead>Paid At</TableHead>
							<TableHead>First name</TableHead>
							<TableHead>Last name</TableHead>
							<TableHead>Address</TableHead>
							<TableHead>Phone</TableHead>
							<TableHead>DOB</TableHead>
							<TableHead>Health card</TableHead>
							<TableHead>Playing role</TableHead>
							<TableHead>T-shirt size</TableHead>
							<TableHead>Batsman rating</TableHead>
							<TableHead>Handed batsman</TableHead>
							<TableHead>Batting comment</TableHead>
							<TableHead>Bowler rating</TableHead>
							<TableHead>Arm bowler</TableHead>
							<TableHead>Type bowler</TableHead>
							<TableHead>Bowling comment</TableHead>
							<TableHead>Fielding rating</TableHead>
							<TableHead>Fielding comment</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{players.map((player, index) => (
							<TableRow
								key={`${player.firstName}-${player.dob}`}
								className="divide-x"
							>
								<TableCell>{++index}</TableCell>
								<TableCell>{player.id}</TableCell>
								<TableCell>{player.paid ? 'Yes' : 'No'}</TableCell>
								<TableCell>{player.paidAt}</TableCell>
								<TableCell>{player.firstName}</TableCell>
								<TableCell>{player.lastName}</TableCell>
								<TableCell>{player.address}</TableCell>
								<TableCell>{player.phNo}</TableCell>
								<TableCell>{player.dob.toString().split('T')[0]}</TableCell>
								<TableCell>{player.healthCard ? 'Yes' : 'No'}</TableCell>
								<TableCell>{player.playingRole}</TableCell>
								<TableCell>{player.tshirtSize}</TableCell>
								<TableCell>{player.batsmanRating}</TableCell>
								<TableCell>{player.handedBatsman}</TableCell>
								<TableCell>{player.battingComment}</TableCell>
								<TableCell>{player.bowlerRating}</TableCell>
								<TableCell>{player.armBowler}</TableCell>
								<TableCell>{player.typeBowler}</TableCell>
								<TableCell>{player.bowlingComment}</TableCell>
								<TableCell>{player.fielderRating}</TableCell>
								<TableCell>{player.fielderComment}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</main>
	)
}
