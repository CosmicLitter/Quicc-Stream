<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { getDestinyService } from '$lib/services/destiny';
	import { onMount } from 'svelte';

	const destinyService = getDestinyService();

	let user = $state();
	let displayName = $state('');
	let code = $state('');
	async function TestSearchUser(name: string, id: string) {
		// const searchResponse = await destinyService.exactSearchUser(name, id);
		// console.log('search response', searchResponse);
		// return searchResponse;
		const activeProfile = await destinyService.getActiveProfile(name, id);
		return activeProfile;

		// const matchingUser = searchResponse.Response.searchResults.find(
		// 	(result) => result.bungieGlobalDisplayNameCode === Number(id)
		// );
		//
		// if (matchingUser) {
		// 	console.log('Found!:', matchingUser);
		// } else {
		// 	console.log('Not Found!', matchingUser);
		// }
	}

	onMount(() => {
		// TestSearchUser('Ozzcold', '1699');
	});
</script>

<Input bind:value={displayName} />
<Input bind:value={code} />

<Button
	onclick={async () => {
		user = await TestSearchUser(displayName, code);
	}}
>
	Get user detail
</Button>
<pre>
{JSON.stringify(user, null, 2)}
</pre>
