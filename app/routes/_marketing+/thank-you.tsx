import { redirect, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { prisma } from '../../utils/db.server'

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
		select: { id: true, firstName: true, lastName: true, email: true },
		where: { id },
	})

	if (!player) throw redirect('/registration')

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
				Congratulations {player.firstName} {player.lastName}, your registration
				number is <b>{player.id}</b>.
			</p>
			<p className="text-lg sm:text-xl md:text-2xl lg:text-3xl">
				An email has been sent to <b>{player.email}</b> with more information.
			</p>
		</div>
	)
}
