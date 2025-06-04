import {
	getFormProps,
	getInputProps,
	useForm,
	useInputControl,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import * as SelectPrimitive from '@radix-ui/react-select'
import { json } from '@remix-run/node'
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import {
	Form,
	useActionData,
	useLoaderData,
	useSearchParams,
} from '@remix-run/react'
import { useCallback, useEffect, useId, useState } from 'react'
import { z } from 'zod'
import { Button } from '#app/components/ui/button'
import type { SelectProps } from '#app/components/ui/select'
import { getTeamsForOptions, sellPlayer } from '#app/services/backend/api'
import { requirePlayerId } from '#app/utils/auth.server'
import { getErrorMessage, tryCatch, useIsPending } from '#app/utils/misc'
import { redirectWithToast } from '#app/utils/toast.server'

export const CURRENT_PLAYER_ID_KEY = 'current-player-id'
export const CURRENT_TEAM_ID_KEY = 'current-team-id'
export const NEXT_PLAYER_VALUE = 'next-player'

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

	const teams = await getTeamsForOptions()

	return { teams }
}

export async function action({ request }: ActionFunctionArgs) {
	await requirePlayerId(request)

	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema: sellFormSchema })

	if (submission.status !== 'success') {
		return json(
			{
				result: submission.reply(),
				success: false,
				message: 'Invalid form data',
			},
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { data: updatedPlayer, error: sellError } = await tryCatch(
		sellPlayer(
			submission.value.id,
			submission.value.teamId,
			submission.value.soldFor,
		),
	)

	if (sellError || !updatedPlayer) {
		return redirectWithToast('/admin/auction/panel', {
			title: 'Failed to sell player',
			description: getErrorMessage(sellError),
			type: 'error',
		})
	}

	return redirectWithToast('/admin/auction/panel?success=true', {
		description: 'Player sold!',
		type: 'success',
	})
}

export default function AdminAuctionPanel() {
	const [searchParams, setSearchParams] = useSearchParams()
	const { teams } = useLoaderData<typeof loader>()
	const [playerId, setPlayerId] = useState<string | null>(null)

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
			soldFor: '$',
		},
	})

	const populatePlayerId = useCallback(() => {
		const playerId = localStorage.getItem(CURRENT_PLAYER_ID_KEY)
		if (playerId === NEXT_PLAYER_VALUE) {
			setPlayerId(null)
		} else {
			setPlayerId(playerId || null)
		}
	}, [])

	useEffect(() => {
		populatePlayerId()
		window.addEventListener('storage', populatePlayerId)

		return () => {
			window.removeEventListener('storage', populatePlayerId)
		}
	}, [populatePlayerId])

	useEffect(() => {
		if (searchParams.get('success') === 'true') {
			localStorage.removeItem(CURRENT_PLAYER_ID_KEY)
			localStorage.setItem(CURRENT_TEAM_ID_KEY, form.value?.teamId || '')
			setSearchParams(prev => {
				prev.delete('success')
				return prev
			})
			setPlayerId(null)
		}
	}, [form.value?.teamId, searchParams, setSearchParams])

	return (
		<main className="flex-1 bg-zinc-800">
			<div className="flex h-screen flex-col gap-6 p-6">
				<div className="flex flex-col gap-2">
					<h1 className="text-5xl font-bold">Auction Panel</h1>
					<p className="text-xl text-zinc-400">
						Make sure that you see player id below before selling the player.
					</p>
				</div>
				<p>player id: {playerId}</p>
				<p>{form?.errors?.toString()}</p>
				{playerId ? (
					<Form
						method="POST"
						className="flex flex-col justify-between gap-6"
						{...getFormProps(form)}
					>
						<input
							{...getInputProps(fields.id, { type: 'hidden' })}
							value={playerId}
						/>
						<div>{fields.id.errors}</div>
						<p className="rounded-3xl bg-black p-6 text-center text-h2 capitalize">
							<input
								{...getInputProps(fields.soldFor, {
									type: 'text',
								})}
								className="ml-2 bg-transparent p-0 text-center focus:outline-none"
								autoFocus
							/>
						</p>
						<div>{fields.soldFor.errors}</div>
						<SelectField
							selectProps={{
								...getInputProps(fields.teamId, { type: 'text' }),
								options: teams.map(team => ({
									value: team.id.toString(),
									label: team.teamName,
								})),
								placeholder: 'Select team',
							}}
						/>
						<div>{fields.teamId.errors}</div>
						<button
							type="submit"
							className="rounded-3xl bg-black p-6 text-center text-h2 capitalize"
							disabled={isPending}
						>
							<span>{isPending ? 'Selling...' : 'Sell'}</span>
						</button>
					</Form>
				) : (
					<div>
						<p>No player found in the local storage</p>
						<Button
							onClick={() => {
								localStorage.setItem(CURRENT_PLAYER_ID_KEY, NEXT_PLAYER_VALUE)
								localStorage.removeItem(CURRENT_TEAM_ID_KEY)
							}}
							className="mt-4"
						>
							Next Player
						</Button>
					</div>
				)}
			</div>
		</main>
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
				<p>
					<SelectPrimitive.Value placeholder={selectProps.placeholder} />
				</p>
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
