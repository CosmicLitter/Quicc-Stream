<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	onMount(() => {
		if ($page.url.searchParams.has('error')) {
			console.error($page.url.searchParams);
			goto('/');
		}

		const hashParams = new URLSearchParams(window.location.hash.slice(1));
		const accessToken = hashParams.get('access_token');
		if (accessToken) localStorage.setItem('Token', accessToken);
		goto('/');
	});
</script>
