import {
	getFormProps,
	getInputProps,
	useForm,
	useInputControl,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import * as SelectPrimitive from '@radix-ui/react-select'
import {
	json
	
	
} from '@remix-run/node'
import type {ActionFunctionArgs, LoaderFunctionArgs} from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { useId } from 'react'
import { z } from 'zod'
import type {SelectProps} from '../../components/ui/select';
import { requirePlayerId } from '../../utils/auth.server'
import { redirectWithConfetti } from '../../utils/confetti.server'
import { prisma } from '../../utils/db.server'
import { getPlayerImgSrc, useIsPending } from '../../utils/misc'
import { redirectWithToast } from '../../utils/toast.server'

const sellFormSchema = z.object({
	id: z.string(),
	soldFor: z.preprocess((value, ctx) => {
		let stringValue = String(value)
		stringValue = stringValue.replace('$', '')

		if (Number.isNaN(stringValue)) {
			ctx.addIssue({
				path: ['soldFor'],
				code: z.ZodIssueCode.custom,
				message: 'Must be a number',
			})
		}

		return stringValue
	}, z.number()),
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
			email: true,
			phNo: true,
			address: true,
			batsmanRating: true,
			bowlerRating: true,
			fielderRating: true,
			imageId: true,
		},
	})

	if (!randomPlayer) {
		return redirectWithConfetti('/admin/auction/finish')
	}
	console.log({ teams })
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
			soldFor: submission.value.soldFor,
			team: {
				connect: {
					id: submission.value.teamId,
				},
			},
		},
	})

	if (!player) {
		return redirectWithToast('/admin/auction', {
			type: 'error',
			title: 'Player not sold',
			description: 'Please try again.',
		})
	}

	return redirectWithConfetti('/admin/auction')
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
			console.log(Object.fromEntries(formData))
			return parseWithZod(formData, { schema: sellFormSchema })
		},
		shouldRevalidate: 'onInput',
		defaultValue: {
			id: player.id,
			soldFor: '$',
		},
	})

	if (form.status === 'error') {
		console.info({
			formErrors: form.allErrors,
		})
	}

	return (
		<main className="flex-1 bg-zinc-800">
			<div className="flex h-screen flex-col gap-24 p-6">
				<div className="grid h-[60%] grid-cols-3 grid-rows-1 gap-4">
					<div className="h-full w-full overflow-hidden rounded-3xl">
						<img
							src="/img/logo.png"
							alt="APL PEI 2024"
							className="mx-auto h-full"
						/>
					</div>
					<div className="h-full w-full overflow-hidden rounded-3xl pl-28">
						<div
							style={{
								backgroundImage: `url(${getPlayerImgSrc(player.imageId)})`,
								backgroundSize: 'cover',
								backgroundPosition: 'top',
							}}
							className="h-full w-full overflow-hidden rounded-3xl border-4 border-white"
						/>
					</div>
					<div className="relative">
						<img
							src="/img/acc.png"
							alt="ACC"
							className="absolute inset-0 mx-auto aspect-auto h-full opacity-10"
						/>
						<div className="isolate flex h-full flex-col justify-between">
							<p className="rounded-3xl bg-black p-6 text-center text-h2 ">
								<GradientText>
									<span>
										{player.firstName} {player.lastName}
									</span>
								</GradientText>
							</p>
							<p className="rounded-3xl bg-black p-6 text-center text-h2">
								<GradientText>{formatPhNo(player.phNo)}</GradientText>
							</p>
							<p className="break-words rounded-3xl bg-black p-6 text-center text-h2">
								<GradientText>{player.email}</GradientText>
							</p>
							<p className="rounded-3xl bg-black p-6 text-center text-h2">
								<GradientText>{player.address}</GradientText>
							</p>
						</div>
					</div>
				</div>
				<div className="grid h-full grid-cols-3 grid-rows-1 gap-4">
					<Form
						method="POST"
						className="flex flex-col justify-between"
						{...getFormProps(form)}
					>
						<input {...getInputProps(fields.id, { type: 'hidden' })} />
						<p className="rounded-3xl bg-black p-6 text-center text-h2 capitalize">
							<GradientText>
								<input
									{...getInputProps(fields.soldFor, {
										type: 'text',
									})}
									className="ml-2 bg-transparent p-0 text-center focus:outline-none"
									autoFocus
								/>
							</GradientText>
						</p>
						<SelectField
							selectProps={{
								...getInputProps(fields.teamId, { type: 'text' }),
								options: teams.map(team => ({
									value: team.id,
									label: team.name,
								})),
								placeholder: 'Select team',
							}}
						/>
						<button
							type="submit"
							className="rounded-3xl bg-black p-6 text-center text-h2 capitalize"
						>
							<span className="bg-gradient-to-r from-orange-600 to-yellow-200 bg-clip-text text-transparent">
								{isPending ? 'Selling...' : 'Sell'}
							</span>
						</button>
					</Form>
					<div className="col-span-2 flex flex-col justify-between">
						<div className="flex gap-4">
							<img
								src="/img/batting.png"
								alt="APL PEI 2024"
								className="size-24 rounded-3xl bg-black p-6"
							/>
							<div className="relative flex w-full items-center justify-center overflow-hidden rounded-3xl bg-white">
								<div
									className={`absolute inset-0 h-full ${gradient}`}
									style={{
										width: `${player.batsmanRating * 10}%`,
									}}
								/>
								<p className="z-10 text-h2 text-black">
									{player.batsmanRating} / 10
								</p>
							</div>
						</div>
						<div className="flex gap-4">
							<img
								src="/img/bowling.png"
								alt="APL PEI 2024"
								className="size-24 rounded-3xl bg-black p-6"
							/>
							<div className="relative flex w-full items-center justify-center overflow-hidden rounded-3xl bg-white">
								<div
									className={`absolute inset-0 h-full ${gradient}`}
									style={{
										width: `${player.bowlerRating * 10}%`,
									}}
								/>
								<p className="z-10 text-h2 text-black">
									{player.bowlerRating} / 10
								</p>
							</div>
						</div>
						<div className="flex gap-4">
							<img
								src="/img/fielding.png"
								alt="APL PEI 2024"
								className="size-24 rounded-3xl bg-black p-6"
							/>
							<div className="relative flex w-full items-center justify-center overflow-hidden rounded-3xl bg-white">
								<div
									className={`absolute inset-0 h-full ${gradient}`}
									style={{
										width: `${player.fielderRating * 10}%`,
									}}
								/>
								<p className="z-10 text-h2 text-black">
									{player.fielderRating} / 10
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	)
}

const gradient = 'bg-gradient-to-r from-orange-600 to-yellow-200'
function GradientText({ children }: { children: React.ReactNode }) {
	return (
		<span className={`${gradient} bg-clip-text text-transparent`}>
			{children}
		</span>
	)
}

interface SelectFieldProps
	extends SelectProps,
		Omit<
			React.HTMLAttributes<HTMLButtonElement>,
			'name' | 'defaultValue' | 'dir' | 'value'
		> {
	placeholder?: string
}
function SelectField({
	selectProps,
}: {
	selectProps: SelectFieldProps & {
		form: string
		name: string
	}
}) {
	const fallbackId = useId()
	const input = useInputControl({
		key: selectProps.name ?? fallbackId,
		formId: selectProps.form,
		name: selectProps.name,
		initialValue: selectProps.defaultValue,
	})
	const id = selectProps.id ?? fallbackId

	return (
		<SelectPrimitive.Root
			{...selectProps}
			onValueChange={value => {
				input.change(value)
				selectProps.onValueChange?.(value)
			}}
		>
			<SelectPrimitive.Trigger
				id={id}
				form={selectProps.form}
				onFocus={event => {
					input.focus()
					selectProps.onFocus?.(event)
				}}
				onBlur={event => {
					input.blur()
					selectProps.onBlur?.(event)
				}}
				className="rounded-3xl bg-black p-6 text-center text-h2"
			>
				<GradientText>
					<SelectPrimitive.Value placeholder={selectProps.placeholder} />
				</GradientText>
			</SelectPrimitive.Trigger>
			<SelectPrimitive.Portal>
				<SelectPrimitive.Content
					className="relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-3xl border border-zinc-800 bg-black shadow-md data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
					position="popper"
				>
					<SelectPrimitive.Viewport className="h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] p-2">
						{selectProps.options.map(({ label, value }) => (
							<SelectPrimitive.Item
								key={label}
								value={value}
								className="relative flex w-full cursor-default select-none items-center rounded-3xl py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-zinc-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
							>
								<SelectPrimitive.ItemText>{label}</SelectPrimitive.ItemText>
							</SelectPrimitive.Item>
						))}
					</SelectPrimitive.Viewport>
				</SelectPrimitive.Content>
			</SelectPrimitive.Portal>
		</SelectPrimitive.Root>
	)
}

function formatPhNo(phNo: string) {
	return phNo.replace(/\s/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
}
