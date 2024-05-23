import { type ActionFunctionArgs } from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { sendEmail } from '../../utils/email.server'

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData()
	const email = String(formData.get('email')) || 'zeelmp1990@gmail.com'

	const response = await sendEmail({
		to: email,
		subject: 'APL PEI 2024 - Registration Confirmation',
		html: '<h1>APL PEI 2024 - Registration Confirmation</h1>',
		text: 'APL PEI 2024 - Registration Confirmation',
	})

	return { sent: response.status === 'success' }
}

export default function TestEmail() {
	const data = useActionData<typeof action>()

	return (
		<main className="container flex-1">
			<Form method="POST">
				<Input type="email" name="email" className="max-w-sm" />
				<Button type="submit" className="mt-4">
					Send
				</Button>
			</Form>
			{data?.sent && (
				<div className="mt-4">
					<p>Sent!</p>
				</div>
			)}
		</main>
	)
}
