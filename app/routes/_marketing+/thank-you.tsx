import * as E from '@react-email/components'
import { redirect  } from '@remix-run/node'
import type {LoaderFunctionArgs} from '@remix-run/node';
import { useLoaderData } from '@remix-run/react'
import { prisma } from '../../utils/db.server'
import { sendEmail } from '../../utils/email.server'

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url)
	const id = url.searchParams.get('id')
	const test = url.searchParams.get('test')
	if (test)
		return {
			player: {
				id: 'clwb9tcby0000uaakfexxs35s',
				firstName: 'Johns papa',
				lastName: 'Doe papa',
				email: 'email_email_email@example.com',
			},
		}
	if (!id) throw redirect('/registration')

	const player = await prisma.player.findUnique({
		select: {
			id: true,
			firstName: true,
			lastName: true,
			email: true,
			paid: true,
		},
		where: { id },
	})

	if (!player) throw redirect('/registration')

	if (!player.paid) {
		await prisma.player.update({
			where: { id },
			data: { paid: true, paidAt: new Date() },
		})
	}

	await sendEmail({
		to: player.email,
		subject: `APL PEI 2024 - Registration Confirmation`,
		react: (
			<ConfirmationEmail firstName={player.firstName} confNumber={player.id} />
		),
	})

	return { player }
}

export default function ThankYou() {
	const { player } = useLoaderData<typeof loader>()

	return (
		<div className="container mt-28 flex h-full flex-1 flex-col place-items-center gap-4 text-center">
			<h1 className="max-w-6xl text-h4 sm:text-h3 md:text-h2 lg:text-h1">
				Success 🎉
				<br /> Your registration is complete for APL PEI 2024!
			</h1>
			<p className="mt-5 text-lg sm:text-xl md:text-2xl lg:text-3xl">
				Congratulations Bhulku {player.firstName} {player.lastName}, your
				registration number is <b>{player.id}</b>.
			</p>
			<p className="text-lg sm:text-xl md:text-2xl lg:text-3xl">
				An email will be sent to <b>{player.email}</b> with more information.
			</p>
		</div>
	)
}

export function ConfirmationEmail({
	firstName,
	confNumber,
}: {
	firstName: string
	confNumber: string
}) {
	return (
		<E.Html lang="en" dir="ltr">
			<E.Container>
				<h1>
					<E.Text>
						Bhulku {firstName}, your APL PEI 2024 registration is complete!
					</E.Text>
				</h1>
				<p>
					<E.Text>
						Here's your confirmation number: <strong>{confNumber}</strong>
					</E.Text>
				</p>
				<p>
					<E.Text>
						APL Auction is on <strong>Saturday, June 15</strong> and will be
						played on <strong>Saturday, June 29</strong> and{' '}
						<strong>Sunday, June 30</strong>. Please make sure you're available
						on those dates.
					</E.Text>
				</p>
				<p>
					<E.Text>
						Das na Das Jay Swaminarayan! Thank you for registering! We look
						forward to seeing your skills on the field and making this season
						unforgettable.
					</E.Text>
				</p>
			</E.Container>
		</E.Html>
	)
}
