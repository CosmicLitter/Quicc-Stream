<script lang="ts">
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import SuperDebug from 'sveltekit-superforms';
	import * as Form from '$lib/components/ui/form/index';
	import { registerSchema, type RegisterSchema } from '$lib/zodschemas';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { Input } from '$lib/components/ui/input';
	import { browser } from '$app/environment';

	export let data: SuperValidated<Infer<RegisterSchema>>;

	const form = superForm(data, {
		validators: zodClient(registerSchema),
		onResult: ({ result }) => {
			console.log(result);
		}
	});

	const { form: formData, enhance } = form;
</script>

<form method="POST" use:enhance>
	<Form.Field {form} name="username">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Username</Form.Label>
				<Input {...props} bind:value={$formData.username} />
			{/snippet}
		</Form.Control>
		<!-- <Form.Description></Form.Description> -->
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="password">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Password</Form.Label>
				<Input type="password" {...props} bind:value={$formData.password} />
			{/snippet}
		</Form.Control>
		<!-- <Form.Description></Form.Description> -->
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="confirmPassword">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Confirm Password</Form.Label>
				<Input type="password" {...props} bind:value={$formData.confirmPassword} />
			{/snippet}
		</Form.Control>
		<!-- <Form.Description></Form.Description> -->
		<Form.FieldErrors />
	</Form.Field>

	<Form.Button>Submit</Form.Button>
	{#if browser}
		<SuperDebug label="sample" status={false} data={$formData} />
	{/if}
</form>
