import { PB_ADMIN_PASS, PB_ADMIN_USER } from '$env/static/private';
import { pbError } from '$lib/pocketbase.svelte';
import type { Member } from '$lib/types';
import { json } from '@sveltejs/kit'
import type { RequestHandler } from "@sveltejs/kit";
import { admin } from '$lib/pocketbase.svelte';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const { member }: { member: Member } = await request.json();
    const recordToUpdate = await admin.collection('members').getFirstListItem(`membershipId="${member.membershipId}"`);
    const authData = await admin.admins.authWithPassword(PB_ADMIN_USER, PB_ADMIN_PASS);
    const record = await admin.collection('members').update(recordToUpdate.id!, member)
    return json({ message: `${member.d2Username} was succesfully updated`, record })
  } catch (error) {
    if (error instanceof Error) {
      pbError(error)
    }
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return json({ error: errorMessage }, { status: 500 })
  }
}

