import type { TypedPocketBase } from '$lib/types'
import type { Handle } from '@sveltejs/kit'

import PocketBase from 'pocketbase'
import { dev } from '$app/environment'
import { env } from '$env/dynamic/public'
import { Security } from '$lib/pocketbase.svelte'

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.pb = new PocketBase(env.PUBLIC_POCKETBASE_URL) as TypedPocketBase;
	event.locals.pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');

	try {
		if (event.locals.pb.authStore.isValid) {
			await event.locals.pb.collection('users').authRefresh()
			event.locals.user = event.locals.pb.authStore.model
		}
	} catch (err) {
		console.error('Error during PocketBase .authRefresh():', err);
		event.locals.pb.authStore.clear();
		event.locals.user = null;
	}

	event.locals.security = new Security(event);

	const response = await resolve(event);

	response.headers.set(
		'set-cookie',
		event.locals.pb.authStore.exportToCookie({ httpOnly: false, sameSite: 'Lax', secure: !dev })
	)
	return response;
}
