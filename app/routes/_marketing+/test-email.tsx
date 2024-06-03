import type {ActionFunctionArgs} from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { prisma } from '../../utils/db.server'
import { ConfirmationEmail } from './thank-you'

export async function loader({ request }: ActionFunctionArgs) {
	const url = new URL(request.url)
	const email = url.searchParams.get('email')

	if (email) {
		const player = await prisma.player.findUnique({
			where: { email },
			select: { id: true, firstName: true },
		})
		return {
			player,
		}
	}

	return { player: null }
}

export default function TestEmail() {
	const data = useLoaderData<typeof loader>()

	return (
		<main className="container flex-1">
			<Form method="GET">
				<Input type="email" name="email" className="max-w-sm" />
				<Button type="submit" className="mt-4">
					Send
				</Button>
			</Form>
			{data.player ? (
				<ConfirmationEmail
					firstName={data.player.firstName}
					confNumber={data.player.id}
				/>
			) : null}
		</main>
	)
}
