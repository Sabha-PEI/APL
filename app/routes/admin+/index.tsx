import { type LoaderFunctionArgs } from '@remix-run/node'
import { Form, useLoaderData } from '@remix-run/react'
import { Button } from '../../components/ui/button'
import { requirePlayerId } from '../../utils/auth.server'

export async function loader({ request }: LoaderFunctionArgs) {
	await requirePlayerId(request)
	const isProd = process.env.NODE_ENV === 'production'
	const protocol = isProd ? 'https' : 'http'
	const domain = isProd ? process.env.DOMAIN : 'localhost'

	const iframeSrc = `${protocol}://${domain}:3690`

	return { iframeSrc }
}

export default function Index() {
	const { iframeSrc } = useLoaderData<typeof loader>()

	return (
		<main className="mt-128 container flex flex-1 flex-col place-items-center">
			<h1 className="text-4xl font-bold">Admin Panel</h1>

			<Form method="POST" action="/logout" className="mt-3">
				<Button type="submit">Logout</Button>
			</Form>

			<div className="mt-5 flex w-full flex-1 flex-col pb-20">
				<iframe
					title="Prisma Studio"
					src={iframeSrc}
					width="100%"
					height="100%"
					className="flex-1"
					allowFullScreen
				></iframe>
			</div>
		</main>
	)
}
