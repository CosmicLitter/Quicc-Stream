<script lang="ts">
	import { api } from '$lib/twitchauth';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	let token: string | null = null;
	let apiInitialized = false;

	if (browser) {
		token = localStorage.getItem('Token');
		apiInitialized = !!api;
	}

	async function GetUser() {
		if (!apiInitialized) {
			throw new Error('API not initialized');
		}
		try {
			const user = await api.users.getUserByName('q_quicc');

			if (!user) {
				throw new Error('User not found');
			}
			return {
				broadcasterType: user.broadcasterType,
				displayName: user.displayName,
				description: user.description,
				userId: user.id,
				profilePictureUrl: user.profilePictureUrl,
				type: user.type,
				name: user.name
			};
		} catch (error) {
			console.error('Failed to fetch user:', error);
			throw error;
		}
	}

	async function GetRedeems() {
		if (!apiInitialized) {
			throw new Error('API not initialized');
		}

		const user = await GetUser();
		if (!user.userId) {
			throw new Error('User ID not found');
		}
		const rewards = await api.channelPoints.getCustomRewards(user.userId);
		return rewards;
	}

	onMount(() => {
		if (browser && token && apiInitialized) {
			GetRedeems()
				.then((rewards) => {
					console.log('Channel rewards:', rewards);
				})
				.catch((error) => {
					console.error('Error fetching redeems:', error);
				});
		}
	});
</script>

<div class="grid grid-cols-3 grid-rows-[auto,1fr] gap-4 p-8">
	<div class="col-span-3 mx-auto w-96">
		<!-- <Button on:click={GetRedeems}> Get Redeems </Button> -->
	</div>
	<div class="overflow-auto border">
		{#await GetUser()}
			<p>... getting user</p>
		{:then user}
			<pre>
{JSON.stringify(user, null, 2)}
	</pre>
		{:catch}
			<p>Unable to fetch data</p>
		{/await}
	</div>
	<div class="overflow-auto border">
		{#await GetRedeems()}
			<p>... Getting channel point rewards</p>
		{:then rewards}
			{#each rewards as reward}
				<div>
					<p class="font-bold">
						{reward.title}
					</p>
					<p>{reward.id}</p>
				</div>
			{/each}
		{:catch}
			<p>Unable to fetch data</p>
		{/await}
	</div>
</div>
