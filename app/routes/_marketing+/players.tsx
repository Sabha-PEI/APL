import { useLoaderData } from '@remix-run/react'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '#app/components/ui/table'
import { prisma } from '../../utils/db.server'

export async function loader() {
	const players = await prisma.player.findMany({
		select: {
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
		},
		where: {
			type: 'player',
		},
	})

	return { players }
}

export default function Players() {
	const { players } = useLoaderData<typeof loader>()

	return (
		<div className="my-10 flex h-full flex-1 flex-col place-items-center gap-4 px-16">
			<h1 className="text-h4 sm:text-h3 md:text-h2 lg:text-h1">
				{players.length} Players registered
			</h1>
			<Table className="mt-5 border">
				<TableHeader>
					<TableRow className="divide-x">
						<TableHead></TableHead>
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
	)
}
