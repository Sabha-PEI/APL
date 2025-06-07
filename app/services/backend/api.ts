import type { Player, Team } from './types'

const API_URL =
	'https://aplpei2025-b4bdfzfwgthadsf5.canadacentral-01.azurewebsites.net'

export async function getRandomPlayer(): Promise<Player | null> {
	const response = await fetch(`${API_URL}/players/random`)
	const data = await response.json()
	const player = data as unknown as Player
	if (player.id !== 0 && player.name !== 'No unsold players available')
		return player
	return null
}

export async function getTeamsForOptions(): Promise<
	Pick<Team, 'id' | 'teamName'>[]
> {
	const response = await fetch(`${API_URL}/teams`)
	const data = await response.json()
	return data as unknown as Pick<Team, 'id' | 'teamName'>[]
}

export async function getPlayerById(id: string): Promise<Player> {
	const response = await fetch(`${API_URL}/players/${id}`)
	const data = await response.json()
	return data as unknown as Player
}

export async function getAllTeams(): Promise<Team[]> {
	const response = await fetch(`${API_URL}/teams/getallteams`)
	const data = await response.json()
	return data as unknown as Team[]
}

export async function getTeamById(id: string): Promise<Team> {
	const response = await fetch(`${API_URL}/players/team/${id}`)
	const data = await response.json()
	return data as unknown as Team
}

export async function sellPlayer(
	id: string,
	teamId: string,
	soldFor: number,
): Promise<Player> {
	const response = await fetch(`${API_URL}/players/${id}`, {
		method: 'PUT',
		body: JSON.stringify({ teamId, playerSoldAmount: soldFor }),
		headers: {
			'Content-Type': 'application/json',
		},
	})
	const data = await response.json()
	return data as unknown as Player
}
