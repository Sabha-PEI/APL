import { type SerializeFrom } from '@remix-run/node'
import { useRouteLoaderData } from '@remix-run/react'
import { type loader as rootLoader } from '#app/root.tsx'

function isPlayer(
	player: any,
): player is SerializeFrom<typeof rootLoader>['player'] {
	return player && typeof player === 'object' && typeof player.id === 'string'
}

export function useOptionalPlayer() {
	const data = useRouteLoaderData<typeof rootLoader>('root')
	if (!data || !isPlayer(data.player)) {
		return undefined
	}
	return data.player
}

export function usePlayer() {
	const maybePlayer = useOptionalPlayer()
	if (!maybePlayer) {
		throw new Error(
			'No player found in root loader, but player is required by usePlayer. If player is optional, try useOptionalPlayer instead.',
		)
	}
	return maybePlayer
}
