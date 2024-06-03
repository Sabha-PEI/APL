import {
	unstable_createMemoryUploadHandler,
	unstable_parseMultipartFormData,
	redirect,
} from '@remix-run/node'
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node'
import { Form } from '@remix-run/react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { requirePlayerId } from '../../utils/auth.server'
import { prisma } from '../../utils/db.server'
import { MAX_UPLOAD_SIZE } from '../_marketing+/registration'

export async function loader({ request }: LoaderFunctionArgs) {
	await requirePlayerId(request)
	return {}
}

export async function action({ request }: ActionFunctionArgs) {
	await requirePlayerId(request)
	const uploadHandler = unstable_createMemoryUploadHandler({
		maxPartSize: MAX_UPLOAD_SIZE,
	})

	const formData = await unstable_parseMultipartFormData(request, uploadHandler)
	const name = formData.get('name') as string
	const image = formData.get('image') as File

	const team = await prisma.team.create({
		data: {
			name,
			image: {
				create: {
					contentType: image.type,
					blob: Buffer.from(await image.arrayBuffer()),
				},
			},
		},
		select: {
			id: true,
		},
	})

	if (!team) {
		throw new Error('Could not create team')
	}

	return redirect(`/admin/teams`)
}

export default function TeamsNew() {
	return (
		<main className="container flex flex-1 flex-col place-items-center">
			<Form
				method="POST"
				encType="multipart/form-data"
				className="flex flex-col gap-3"
			>
				<Input type="text" name="name" placeholder="Team Name" />
				<Input type="file" name="image" />
				<Button type="submit">Create Team</Button>
			</Form>
		</main>
	)
}
