import { type MetaFunction } from '@remix-run/node'
import { Link } from '@remix-run/react'
import { Button } from '../../components/ui/button'
import { useOptionalPlayer } from '../../utils/player'

export const meta: MetaFunction = () => [{ title: 'APL PEI 2024' }]

export default function Index() {
	const player = useOptionalPlayer()

	return (
		<div className="mt-128 container flex h-full flex-1 flex-col place-items-center">
			<img src="/public/img/logo.png" alt="APL PEI 2024" className="w-56" />
			<h1 className="text-4xl font-bold">APL PEI 2024</h1>
			{player ? (
				<Button className="mt-4" asChild>
					<Link to="/admin">Admin</Link>
				</Button>
			) : (
				<Button className="mt-4" asChild>
					<Link to="/registration">Register</Link>
				</Button>
			)}
		</div>
	)
}
