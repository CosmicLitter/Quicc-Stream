import type { Reroute } from '@sveltejs/kit'

// TODO : Explore what this does when hosting online
export const reroute: Reroute = ({ url }) => {
	if (url.hostname !== 'localhost') {
		return '/' + url.hostname + url.pathname
	}
	return url.pathname
}
