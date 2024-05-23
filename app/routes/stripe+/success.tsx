import { type LoaderFunctionArgs } from '@remix-run/node'
import { redirectWithConfetti } from '../../utils/confetti.server'

// redirect with confetti for better UI
export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url)
	const id = url.searchParams.get('id')

	return redirectWithConfetti(`/thank-you?id=${id}`)
}
