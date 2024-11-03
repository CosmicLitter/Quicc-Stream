<script lang="ts">
	import { browser } from '$app/environment';
	import { Button } from '$lib/components/ui/button/index';
	import { DestinyService } from '$lib/services/destiny';
	import { type LocalMember, type Member } from '$lib/types';
	import { toast } from 'svelte-sonner';

	async function migrateMembers() {
		let localMembers: LocalMember[] | null = null;
		if (browser) {
			localMembers = JSON.parse(localStorage.getItem('clan')!);
		}

		if (!localMembers) return;

		const destinyService = new DestinyService();

		for (let member of localMembers) {
			try {
				const searchResponse = await destinyService.searchUser(member.d2_username);

				// Find matching user from search results
				const matchingUser = searchResponse.Response.searchResults.find(
					(result) => result.bungieGlobalDisplayNameCode === Number(member.d2_id)
				);

				if (matchingUser) {
					const activeMembership = await destinyService.determineActiveMembership(matchingUser);

					console.log(activeMembership);
					const newMember: Member = {
						d2Username: member.d2_username,
						d2Id: member.d2_id,
						twitchUsername: member.twitch_username,
						youtubeUsername: member.youtube_username,
						sessionCount: member.participation_count,
						isActive: true,
						bungieNetMembershipId: activeMembership.bungieNetMembershipId,
						membershipId: activeMembership.membershipId,
						membershipType: activeMembership.membershipType
					};

					// Add new member to the Database
					console.log('Adding new member:', newMember);
					const response = await fetch('./api/db/addmember', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({ member: newMember })
					});

					if (!response.ok) {
						const error = await response.json();
						throw new Error(error.message || 'Failed to migrate member');
					}

					toast(`${newMember.d2Username}#${newMember.d2Id} was successfully added`);

					console.log(response.json());
				} else {
					toast(
						`${member.d2_username}#${member.d2_id} could not be validated, is the Username and ID correct?`
					);
					console.log(
						`${member.d2_username}#${member.d2_id} was not found in the D2 API, Is username and ID correct?`
					);
				}
			} catch (error) {
				console.error(`Error processing member ${member.d2_username}:`, error);
			}
		}
	}

	console.log(Number('0123'));
</script>

<Button onclick={migrateMembers}>Migrate</Button>
