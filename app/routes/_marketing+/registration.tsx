import {
	getFormProps,
	useForm,
	getInputProps,
	getTextareaProps,
	getFieldsetProps,
} from '@conform-to/react'
import type { FieldMetadata } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { json, redirect } from '@remix-run/node'
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import {
	Form,
	useActionData,
	useLoaderData,
	useSearchParams,
} from '@remix-run/react'
import { useState } from 'react'
import { HoneypotInputs } from 'remix-utils/honeypot/react'
import { z } from 'zod'
import {
	ErrorList,
	Field,
	RadioGroupField,
	SelectField,
	SliderField,
	TextareaField,
} from '../../components/forms'
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { Icon } from '../../components/ui/icon'
import { StatusButton } from '../../components/ui/status-button'
import { createStripeCheckoutSession } from '../../services/stripe/api/create-checkout-session'
import { prisma } from '../../utils/db.server'
import { checkHoneypot } from '../../utils/honeypot.server'
import {
	cn,
	getDomainUrl,
	getPlayerImgSrc,
	useIsPending,
} from '../../utils/misc'

export const MAX_UPLOAD_SIZE = 1024 * 1024 * 3 // 3MB

export const ImageFieldsetSchema = z.object({
	id: z.string().optional(),
	file: z
		.instanceof(File, {
			message: 'Select a file',
		})
		.refine(file => {
			return !file || file.size <= MAX_UPLOAD_SIZE
		}, `File size must be less than ${MAX_UPLOAD_SIZE}MB`),
	altText: z.string().optional(),
})
type ImageFieldset = z.infer<typeof ImageFieldsetSchema>

export function imageHasFile(
	image: ImageFieldset,
): image is ImageFieldset & { file: NonNullable<ImageFieldset['file']> } {
	return Boolean(image.file?.size && image.file?.size > 0)
}

const RegistrationFormSchema = z.object({
	firstName: z
		.string({
			required_error: 'First name is required',
		})
		.min(2, {
			message: 'First name must be at least 2 characters',
		}),
	lastName: z
		.string({
			required_error: 'Last name is required',
		})
		.min(2, {
			message: 'Last name must be at least 2 characters',
		}),
	address: z.string().min(1, {
		message: 'Full address is required.',
	}),
	phNo: z.string().min(10).max(10),
	dob: z.date().max(new Date()),
	email: z.string().email('Invalid email address.'),
	healthCard: z
		.enum(['yes', 'no'], {
			required_error: 'Select an option',
		})
		.transform(value => value === 'yes'),
	playingRole: z.enum(['batsman', 'bowler', 'allRounder', 'wicketKeeper'], {
		required_error: 'Select an option',
	}),
	tshirtSize: z.enum(['s', 'm', 'l', 'xl'], {
		required_error: 'Select an option',
	}),
	batsmanRating: z
		.number({
			required_error: 'Select a batsman rating.',
		})
		.min(0)
		.max(10),
	handedBatsman: z.enum(['right-handed', 'left-handed'], {
		required_error: 'Select an option',
	}),
	battingComment: z
		.string({
			required_error: 'Enter a comment.',
		})
		.trim()
		.min(5, 'Comment must be at least 5 characters.'),
	bowlerRating: z.number().min(0).max(10),
	armBowler: z.enum(['right-arm', 'left-arm'], {
		required_error: 'Select an option',
	}),
	typeBowler: z.enum(['fast', 'medium', 'spin'], {
		required_error: 'Select an option',
	}),
	bowlingComment: z
		.string({
			required_error: 'Enter a comment.',
		})
		.trim()
		.min(5, 'Comment must be at least 5 characters.'),
	fielderRating: z.number().min(0).max(10),
	fielderComment: z
		.string({
			required_error: 'Enter a comment.',
		})
		.trim()
		.min(5, 'Comment must be at least 5 characters.'),
	image: ImageFieldsetSchema,
})

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url)
	const id = url.searchParams.get('id')
	const pay = url.searchParams.get('pay')
	if (id && pay) {
		console.log({ id })
		const player = await prisma.player.findUnique({
			where: { id },
			select: {
				firstName: true,
				lastName: true,
				email: true,
				phNo: true,
				healthCard: true,
				playingRole: true,
				tshirtSize: true,
				dob: true,
				batsmanRating: true,
				handedBatsman: true,
				battingComment: true,
				bowlerRating: true,
				armBowler: true,
				typeBowler: true,
				bowlingComment: true,
				fielderRating: true,
				fielderComment: true,
				address: true,
				paid: true,
				image: {
					select: {
						id: true,
					},
				},
			},
		})
		console.log({ player })
		if (player) {
			if (!player.paid || pay === 'canceled') {
				return { player }
			}
			return redirect(`/thank-you?id=${id}`)
		}
	}

	return { player: null }
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData()
	checkHoneypot(formData)
	const submission = await parseWithZod(formData, {
		async: true,
		schema: RegistrationFormSchema.superRefine(
			async ({ email, image }, ctx) => {
				const player = await prisma.player.findUnique({
					select: { id: true, paid: true, image: true },
					where: { email },
				})
				if (player && player.paid) {
					throw redirect(`/thank-you?id=${player.id}`)
				}
				if (!player && !imageHasFile(image)) {
					ctx.addIssue({
						path: ['image'],
						code: z.ZodIssueCode.custom,
						message: 'Image is required',
					})
				}
			},
		).transform(({ phNo, ...data }) => {
			return {
				...data,
				phNo: phNo.replace(/[^0-9]/g, ''),
			}
		}),
	})

	if (submission.status !== 'success') {
		return json(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { id } = await prisma.player.upsert({
		where: { email: submission.value.email },
		select: { id: true },
		create: {
			type: 'player',
			paid: false,
			...submission.value,
			image: {
				create: {
					blob: Buffer.from(await submission.value.image.file.arrayBuffer()),
					contentType: submission.value.image.file.type,
					altText: submission.value.image.altText,
				},
			},
		},
		update: {
			...submission.value,
			image: {
				update: {
					where: {
						id: submission.value.image.id,
					},
					data: {
						blob: Buffer.from(await submission.value.image.file.arrayBuffer()),
						contentType: submission.value.image.file.type,
						altText: submission.value.image.altText,
					},
				},
			},
		},
	})

	const url = await createStripeCheckoutSession(request, {
		success_url: `${getDomainUrl(request)}/stripe/success?id=${id}`,
		cancel_url: `${getDomainUrl(request)}/stripe/cancel?id=${id}`,
	})

	return redirect(url)
}

export default function Registration() {
	const loaderData = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const isSubmitting = useIsPending()
	const [searchParams] = useSearchParams()
	const pay = searchParams.get('pay')

	const [form, fields] = useForm({
		id: 'registration',
		constraint: getZodConstraint(RegistrationFormSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: RegistrationFormSchema })
		},
		shouldRevalidate: 'onInput',
		defaultValue: loaderData.player
			? {
					...loaderData.player,
					healthCard: loaderData.player.healthCard ? 'yes' : 'no',
					dob: new Date(loaderData.player.dob).toISOString().split('T')[0],
				}
			: undefined,
	})
	if (form.status === 'error') {
		console.info({
			formErrors: form.allErrors,
		})
	}

	return (
		<div className="container my-10 flex h-full flex-1 flex-col place-items-center gap-4">
			<h1 className="text-h4 sm:text-h3 md:text-h2 lg:text-h1">
				APL Registration for 2024
			</h1>
			<p className="max-w-xl text-center text-muted-foreground">
				APL Auction is on{' '}
				<span className="font-bold underline">Saturday, June 15</span> and will
				be played on{' '}
				<span className="font-bold underline">Saturday, June 29</span> and{' '}
				<span className="font-bold underline">Sunday, June 30</span>. Please
				make sure you're available on those dates before registering.
			</p>
			{pay === 'canceled' && (
				<Alert variant="destructive">
					<Icon name="exclamation-circle-outline" className="size-4" />
					<AlertTitle>Payment canceled</AlertTitle>
					<AlertDescription>
						Your registration is not complete. Please pay with Stripe to
						complete your registration.
					</AlertDescription>
				</Alert>
			)}
			<Form method="POST" {...getFormProps(form)} encType="multipart/form-data">
				<HoneypotInputs />
				{form.status === 'error' && (
					<details className="w-full rounded-md bg-accent p-4 text-foreground-destructive">
						<summary>Form Errors</summary>
						<ul>
							{Object.values(form.allErrors).map((error, index) => (
								<li key={index}>
									{Object.keys(form.allErrors)[index]}: {error[0]}
								</li>
							))}
						</ul>
					</details>
				)}
				<fieldset
					disabled={isSubmitting}
					className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2"
				>
					<div className="flex flex-col gap-2">
						<div className="grid grid-cols-2 gap-4">
							<Field
								labelProps={{
									children: 'First name',
								}}
								inputProps={{
									autoFocus: true,
									...getInputProps(fields.firstName, { type: 'text' }),
								}}
								errors={fields.firstName.errors}
							/>
							<Field
								labelProps={{
									children: 'Last name',
								}}
								inputProps={getInputProps(fields.lastName, { type: 'text' })}
								errors={fields.lastName.errors}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<Field
								labelProps={{
									children: 'Full address',
								}}
								inputProps={getInputProps(fields.address, { type: 'text' })}
								errors={fields.address.errors}
							/>
							<Field
								labelProps={{
									children: 'Date of Birth',
								}}
								inputProps={{
									...getInputProps(fields.dob, { type: 'date' }),
									max: new Date().toISOString().split('T')[0],
									pattern: '[0-9]{4}-[0-9]{2}-[0-9]{2}',
								}}
								errors={fields.dob.errors}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<Field
								labelProps={{
									children: 'Email',
								}}
								inputProps={getInputProps(fields.email, { type: 'email' })}
								errors={fields.email.errors}
							/>
							<Field
								labelProps={{
									children: 'Phone number',
								}}
								inputProps={{
									...getInputProps(fields.phNo, { type: 'text' }),
									placeholder: '1234567890',
									autoComplete: 'tel',
								}}
								errors={fields.phNo.errors}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="flex items-start gap-1">
									<span>Picture</span>
									<span className="text-sm leading-none">
										<span className="text-foreground-destructive">*</span>
										<span className="sr-only">Required</span>
									</span>
								</p>
								<ImageChooser meta={fields.image} />
								<p className="text-muted-foreground">
									Photo should be portrait and face should be visible
								</p>
							</div>
							<RadioGroupField
								labelProps={{
									children: 'Do you have health card?',
								}}
								radiosProps={fields.healthCard}
								options={[
									{ value: 'yes', label: 'Yes, I have' },
									{ value: 'no', label: "No, I don't" },
								]}
								errors={fields.healthCard.errors}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<SelectField
								labelProps={{
									children: 'Playing role',
								}}
								selectProps={{
									...getInputProps(fields.playingRole, { type: 'text' }),
									options: [
										{ label: 'Batsman', value: 'batsman' },
										{ label: 'Bowler', value: 'bowler' },
										{ label: 'All Rounder', value: 'allRounder' },
										{ label: 'Wicketkeeper', value: 'wicketKeeper' },
									],
									placeholder: 'Select playing role',
								}}
								errors={fields.playingRole.errors}
							/>
							<SelectField
								labelProps={{
									children: 'T-shirt size',
								}}
								selectProps={{
									...getInputProps(fields.tshirtSize, { type: 'text' }),
									options: [
										{ label: 'S', value: 's' },
										{ label: 'M', value: 'm' },
										{ label: 'L', value: 'l' },
										{ label: 'XL', value: 'xl' },
									],
									placeholder: 'Select t-shirt size',
								}}
								errors={fields.tshirtSize.errors}
							/>
						</div>
					</div>
					<div className="flex flex-col gap-2">
						<h2 className="ms:text-h3 text-xl sm:text-h4 lg:text-h2">
							Batting
						</h2>
						<SliderField
							labelProps={{
								children: 'Batsman rating',
							}}
							sliderProps={fields.batsmanRating}
							errors={fields.batsmanRating.errors}
						/>
						<RadioGroupField
							labelProps={{
								children: 'Which handed batsman?',
							}}
							radiosProps={fields.handedBatsman}
							options={[
								{ value: 'right-handed', label: 'Right' },
								{ value: 'left-handed', label: 'Left' },
							]}
							errors={fields.handedBatsman.errors}
						/>
						<TextareaField
							labelProps={{
								children: 'Batting comment',
							}}
							textareaProps={getTextareaProps(fields.battingComment)}
							errors={fields.battingComment.errors}
						/>

						<h2 className="ms:text-h3 text-xl sm:text-h4 lg:text-h2">
							Bowling
						</h2>
						<SliderField
							labelProps={{
								children: 'Bowler rating',
							}}
							sliderProps={fields.bowlerRating}
							errors={fields.bowlerRating.errors}
						/>
						<RadioGroupField
							labelProps={{
								children: 'Which arm bowler?',
							}}
							radiosProps={fields.armBowler}
							options={[
								{ value: 'right-arm', label: 'Right' },
								{ value: 'left-arm', label: 'Left' },
							]}
							errors={fields.armBowler.errors}
						/>
						<RadioGroupField
							labelProps={{
								children: 'What type of bowler?',
							}}
							radiosProps={fields.typeBowler}
							options={[
								{ value: 'fast', label: 'Fast' },
								{ value: 'medium', label: 'Medium' },
								{ value: 'spin', label: 'Spin' },
							]}
							errors={fields.typeBowler.errors}
						/>
						<TextareaField
							labelProps={{
								children: 'Bowling comment',
							}}
							textareaProps={getTextareaProps(fields.bowlingComment)}
							errors={fields.bowlingComment.errors}
						/>

						<h2 className="ms:text-h3 text-xl sm:text-h4 lg:text-h2">
							Fielding
						</h2>
						<SliderField
							labelProps={{
								children: 'Fielder rating',
							}}
							sliderProps={fields.fielderRating}
							errors={fields.fielderRating.errors}
						/>
						<TextareaField
							labelProps={{
								children: 'Fielding comment',
							}}
							textareaProps={getTextareaProps(fields.fielderComment)}
							errors={fields.fielderComment.errors}
						/>
					</div>
				</fieldset>
				<StatusButton
					type="submit"
					size="lg"
					status={isSubmitting ? 'pending' : 'idle'}
					className="mx-auto text-xl"
				>
					Pay
				</StatusButton>
			</Form>
		</div>
	)
}

function ImageChooser({ meta }: { meta: FieldMetadata<ImageFieldset> }) {
	const fields = meta.getFieldset()
	const existingImage = Boolean(fields.id.initialValue)
	const [previewImage, setPreviewImage] = useState<string | null>(
		fields.id.initialValue ? getPlayerImgSrc(fields.id.initialValue) : null,
	)
	const { key, ...fileInputProps } = getInputProps(fields.file, {
		type: 'file',
	})

	return (
		<fieldset {...getFieldsetProps(meta)}>
			<div>
				<div>
					<div className="relative h-32 w-32">
						<label
							htmlFor={fields.file.id}
							className={cn('group absolute h-32 w-32 rounded-lg', {
								'bg-accent opacity-40 focus-within:opacity-100 hover:opacity-100':
									!previewImage,
								'cursor-pointer focus-within:ring-4': !existingImage,
							})}
						>
							{previewImage ? (
								<div className="relative">
									<img
										src={previewImage}
										alt={''}
										className="h-32 w-32 rounded-lg object-cover"
									/>
									{existingImage ? null : (
										<div className="pointer-events-none absolute -right-2 -top-2 rounded-sm bg-secondary px-2 py-1 text-xs text-secondary-foreground shadow-md">
											new
										</div>
									)}
								</div>
							) : (
								<div className="flex h-32 w-32 items-center justify-center rounded-lg border border-muted-foreground text-4xl text-muted-foreground">
									<Icon name="plus" />
								</div>
							)}
							{existingImage ? (
								<input {...getInputProps(fields.id, { type: 'hidden' })} />
							) : null}
							<input
								aria-label="Image"
								className="absolute left-0 top-0 z-0 h-32 w-32 cursor-pointer opacity-0"
								onChange={event => {
									const file = event.target.files?.[0]

									if (file) {
										const reader = new FileReader()
										reader.onloadend = () => {
											setPreviewImage(reader.result as string)
										}
										reader.readAsDataURL(file)
									} else {
										setPreviewImage(null)
									}
								}}
								accept="image/*"
								{...fileInputProps}
							/>
						</label>
					</div>
					<div className="min-h-[32px] px-4 pb-3 pt-1">
						<ErrorList id={fields.file.errorId} errors={fields.file.errors} />
					</div>
				</div>
			</div>
			<div className="min-h-[32px] px-4 pb-3 pt-1">
				<ErrorList id={meta.errorId} errors={meta.errors} />
			</div>
		</fieldset>
	)
}
