<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import type { ComponentProps } from "svelte";
    import { authStore } from "$lib/store/authStore";
    import { onDestroy } from "svelte";
    import { appRoutePath } from "$lib/config/route";

    const { register } = $derived(authStore);
    const form = $state({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    async function handleSubmit(event: Event) {
        event.preventDefault();
        await register(form.name, form.email, form.password);
    }

	let { ...restProps }: ComponentProps<typeof Card.Root> = $props();


</script>

<Card.Root {...restProps}>
	<Card.Header>
		<Card.Title>Create an account</Card.Title>
		<Card.Description>Enter your information below to create your account</Card.Description>
	</Card.Header>
	<Card.Content>
		<form>
			<Field.Group>
				<Field.Field>
					<Field.Label for="name">Full Name</Field.Label>
					<Input id="name" type="text" placeholder="John Doe" bind:value={form.name} required />
				</Field.Field>
				<Field.Field>
					<Field.Label for="email">Email</Field.Label>
					<Input id="email" type="email" placeholder="m@example.com" bind:value={form.email} required />
					<Field.Description>
						We'll use this to contact you. We will not share your email with anyone
						else.
					</Field.Description>
				</Field.Field>
				<Field.Field>
					<Field.Label for="password">Password</Field.Label>
					<Input id="password" type="password" bind:value={form.password} required />
					<Field.Description>Must be at least 8 characters long.</Field.Description>
				</Field.Field>
				<Field.Field>
					<Field.Label for="confirm-password">Confirm Password</Field.Label>
					<Input id="confirm-password" type="password" bind:value={form.confirmPassword} required />
					<Field.Description>Please confirm your password.</Field.Description>
				</Field.Field>
				<Field.Group>
					<Field.Field>
						<Button type="submit" onclick={handleSubmit}>Create Account</Button>
						<!-- <Button variant="outline" type="button">Sign up with Google</Button> -->
						<Field.Description class="px-6 text-center">
							Already have an account? <a href={appRoutePath.auth.login}>Sign in</a>
						</Field.Description>
					</Field.Field>
				</Field.Group>
			</Field.Group>
		</form>
	</Card.Content>
</Card.Root>
