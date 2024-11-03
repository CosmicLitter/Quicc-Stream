import type { ClientResponseError, TypedPocketBase, User } from '$lib/types';
import { redirect, error, type RequestEvent } from '@sveltejs/kit';
import { browser, dev } from '$app/environment'
import Pocketbase from 'pocketbase'
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

export const pbError = (e: unknown) => {
	const err = e as ClientResponseError
	if (dev) console.log(err?.response)
	error(err?.status, err?.response?.message)
}

export class Security {
	private readonly user: User | null;

	constructor(private readonly event: RequestEvent) {
		this.user = event.locals.user || null;
	}

	isAuthenticated() {
		if (!this.user) {
			error(401, 'You are not signed in.');
		};
		if (!this.user?.verified) {
			redirect(307, '/verify')
		};
		return this;
	}

	isAdmin() {
		this.isAuthenticated();

		if (this.user && !this.user?.admin) {
			error(403, 'Your account is not an administrator.')
		};
		return this;
	}

}

export const admin = new Pocketbase(PUBLIC_POCKETBASE_URL) as TypedPocketBase
