<script lang="ts">
	import { clan } from '$lib/stores/stores';
	import MemberComponent from '$lib/components/members/MemberComponent.svelte';

	// for (let member of $clan) {
	// 	// console.log(member);
	// }
</script>

<div class="h-full w-full overflow-y-auto">
	<div class="flex flex-wrap gap-6 p-4">
		{#each $clan as member (member.id)}
			<MemberComponent bind:member />
		{/each}
	</div>
</div>
