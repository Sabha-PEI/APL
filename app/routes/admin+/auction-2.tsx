import { useForm, getInputProps, getFormProps } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import {
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
	json,
} from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { Field, SelectField } from '../../components/forms'
import { StatusButton } from '../../components/ui/status-button'
import { requirePlayerId } from '../../utils/auth.server'
import { redirectWithConfetti } from '../../utils/confetti.server'
import { prisma } from '../../utils/db.server'
import { getPlayerImgSrc, useIsPending } from '../../utils/misc'
import { redirectWithToast } from '../../utils/toast.server'

const sellFormSchema = z.object({
	id: z.string(),
	soldFor: z.number(),
	teamId: z.string(),
})

export async function loader({ request }: LoaderFunctionArgs) {
	await requirePlayerId(request)

	const playerIdsPromise = prisma.player.findMany({
		where: { paid: true, type: 'player' },
		select: { id: true },
	})
	const teamsPromise = prisma.team.findMany({
		select: { id: true, name: true, image: { select: { id: true } } },
	})

	const [playerIds, teams] = await Promise.all([playerIdsPromise, teamsPromise])

	const randomPlayerId =
		playerIds[Math.floor(Math.random() * playerIds.length)].id

	const randomPlayer = await prisma.player.findFirst({
		where: { id: randomPlayerId },
		select: {
			id: true,
			firstName: true,
			lastName: true,
			playingRole: true,
			email: true,
			phNo: true,
			batsmanRating: true,
			handedBatsman: true,
			battingComment: true,
			bowlerRating: true,
			armBowler: true,
			typeBowler: true,
			bowlingComment: true,
			fielderRating: true,
			fielderComment: true,
			imageId: true,
		},
	})

	if (!randomPlayer) {
		return redirectWithConfetti('/admin/auction/finish')
	}

	return {
		player: randomPlayer,
		teams,
	}
}

export async function action({ request }: ActionFunctionArgs) {
	await requirePlayerId(request)

	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema: sellFormSchema })

	if (submission.status !== 'success') {
		return json(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const player = await prisma.player.update({
		where: { id: submission.value.id },
		data: {
			paid: true,
			soldFor: submission.value.soldFor,
			team: {
				connect: {
					id: submission.value.teamId,
				},
			},
		},
	})

	if (!player) {
		return redirectWithToast('/admin/auction-2', {
			type: 'error',
			title: 'Player not sold',
			description: 'Please try again.',
		})
	}

	return redirectWithConfetti('/admin/auction-2')
}

export default function Auction() {
	const { player, teams } = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()

	const [form, fields] = useForm({
		id: 'sell-form',
		constraint: getZodConstraint(sellFormSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: sellFormSchema })
		},
		shouldRevalidate: 'onInput',
		defaultValue: {
			id: player.id,
		},
	})

	if (form.status === 'error') {
		console.info({
			formErrors: form.allErrors,
		})
	}

	return (
		<main className="flex flex-1 flex-col items-center gap-4 p-6">
			<img
				src={getPlayerImgSrc(player.imageId)}
				alt={`${player.firstName} ${player.lastName}`}
				className="size-96 rounded-full object-cover object-top"
			/>
			<h1 className="text-4xl font-bold">
				{player.firstName} {player.lastName}
			</h1>
			<div className="text-center">
				<h2 className="text-2xl font-bold capitalize text-muted-foreground">
					{player.playingRole}
				</h2>
				<p className="mt-1 text-muted-foreground">
					{player.email} | {player.phNo}
				</p>
			</div>
			<div className="mt-4 grid w-full grid-cols-3 gap-4">
				<div className="w-full rounded-xl border border-muted-foreground p-6 pt-4">
					<h3 className="w-full text-xl font-bold uppercase">Batting</h3>
					<p className="mt-4 text-lg font-bold capitalize">
						{player.handedBatsman} batsman
					</p>
					<Rating>{player.batsmanRating}</Rating>
					<Comment>{player.battingComment}</Comment>
				</div>
				<div className="w-full rounded-xl border border-muted-foreground p-6 pt-4">
					<h3 className="w-full text-xl font-bold uppercase">Bowling</h3>
					<p className="mt-4 text-lg font-bold capitalize">
						{player.typeBowler} {player.armBowler} bowler
					</p>
					<Rating>{player.bowlerRating}</Rating>
					<Comment>{player.bowlingComment}</Comment>
				</div>
				<div className="w-full rounded-xl border border-muted-foreground p-6 pt-4">
					<h3 className="w-full text-xl font-bold uppercase">Fielding</h3>
					<p className="mt-4 select-none text-lg font-bold text-background">
						Nothing
					</p>
					<Rating>{player.fielderRating}</Rating>
					<Comment>{player.fielderComment}</Comment>
				</div>
			</div>
			<div className="mt-auto">
				<Form
					method="POST"
					{...getFormProps(form)}
					className="flex flex-col items-center"
				>
					<input {...getInputProps(fields.id, { type: 'hidden' })} />
					<div className="flex gap-4">
						<Field
							labelProps={{
								children: 'Amount',
							}}
							inputProps={{
								autoFocus: true,
								...getInputProps(fields.soldFor, { type: 'text' }),
							}}
							errors={fields.soldFor.errors}
						/>
						<SelectField
							labelProps={{
								children: 'Team',
							}}
							selectProps={{
								...getInputProps(fields.teamId, { type: 'text' }),
								options: teams.map(team => ({
									value: team.id,
									label: team.name,
								})),
								placeholder: 'Select team',
							}}
							errors={fields.teamId.errors}
						/>
					</div>
					<StatusButton status={isPending ? 'pending' : 'idle'}>
						Sell
					</StatusButton>
				</Form>
			</div>
		</main>
	)
}

function Rating({ children }: { children: React.ReactNode }) {
	return (
		<p className="mt-2">
			<span className="uppercase text-muted-foreground">rating:</span>
			<span className="ml-2">{children}</span>
		</p>
	)
}

function Comment({ children }: { children: React.ReactNode }) {
	return (
		<div className="mt-2 rounded-lg bg-muted px-4 py-2">
			<p className="mt-1 text-xs uppercase text-muted-foreground">comment</p>
			<p>{children}</p>
		</div>
	)
}
