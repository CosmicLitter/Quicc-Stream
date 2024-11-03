import { PB_ADMIN_PASS, PB_ADMIN_USER } from '$env/static/private';
import { pbError } from '$lib/pocketbase.svelte';
import type { Member } from '$lib/types';
import { json } from '@sveltejs/kit'
import type { RequestHandler } from "@sveltejs/kit";
import { admin } from '$lib/pocketbase.svelte';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const { member }: { member: Member } = await request.json();


    const authData = await admin.admins.authWithPassword(PB_ADMIN_USER, PB_ADMIN_PASS);
    // const existingMember = await admin.collection('members').getFirstListItem(`bungieNetMembershipId="${member.bungieNetMembershipId}"`);
    // if (!existingMember) {
    //   const updated = await locals.pb.collection('members').update(existingMember.id, {
    //     d2Username: member.d2Username,
    //     d2Id: member.d2Id,
    //     twitchUsername: member.twitchUsername,
    //     sessionCount: member.sessionCount,
    //     isActive: member.isActive,
    //     membershipId: member.membershipId,
    //     membershipType: member.membershipType
    //   });
    //
    //   return json({
    //     message: 'Member updated',
    //     member: updated
    //   })
    // }

    // if (existingMember) {
    //   return json({ message: "Member already exists", existingMember })
    // }
    const data = {
      "d2Username": member.d2Username,
      "d2Id": member.d2Id,
      "bungieNetMembershipId": member.bungieNetMembershipId,
      "membershipType": member.membershipType,
      "membershipId": member.membershipId,
      "twitchUsername": member.twitchUsername,
      "youtubeUsername": member.youtubeUsername,
      "roleId": ['vqc5abiylnsk2sy'],
      "sessionCount": member.sessionCount,
      "isActive": member.isActive
    }

    console.log(data)

    // console.log(admin.authStore.isValid)
    // console.log(admin.authStore.token)
    // console.log(admin.authStore.model.id)

    const created = await admin.collection('members').create(data);
    admin.authStore.clear();

    return json({ message: `${data.d2Username} was successfully added`, member: created })
  } catch (error) {
    if (error instanceof Error) {
      pbError(error)
    }
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return json({ error: errorMessage }, { status: 500 })
  }
}
