<script lang="ts">
	import type { PageData } from './$types';
	import RegisterForm from './register-form.svelte';

	export let data: PageData;
</script>

<div class="border border-red-500">
	<RegisterForm data={data.form} />
</div>
