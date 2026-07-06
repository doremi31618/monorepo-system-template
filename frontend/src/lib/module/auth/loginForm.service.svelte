<script lang="ts">
	import { authStore } from "$lib/store/authStore";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { AppConfig } from "$lib/config";
	import { appRoutePath } from "$lib/config/route";
	import { resolve } from "$app/paths";
	import type { AuthState } from "$lib/store/authStore";
	import {
		FieldGroup,
		Field,
		FieldLabel,
		FieldDescription,
		FieldError,
	} from "$lib/components/ui/field/index.js";
	import { onDestroy } from "svelte";


	const id = $props.id();

	let authState = $state<AuthState>({ session: null, user: null, status: "idle", message: null });
	const unsubscribe = authStore.subscribe((value) => (authState = value));
	onDestroy(unsubscribe);
	const { login } = authStore;
	const form = $state({
		email: "",
		password: "",
	});
	const isLoading = $derived(authState.status === "loading");
	const apiError = $derived(authState.status === "error" ? authState.message : null);
	const apiSuccess = $derived(authState.status === "success" ? authState.message : null);

	async function handleSubmit(event: Event) {
		event.preventDefault();
		await login(form.email, form.password);
	}

	async function handleGoogleLogin() {
		window.location.href = `${AppConfig.apiBaseUrl.replace(/\/$/, "")}/auth/google/login`;
	}

</script>

<Card.Root class="mx-auto w-full max-w-sm">
	<Card.Header>
		<Card.Title class="text-2xl">Login</Card.Title>
		<Card.Description>Enter your email below to login to your account</Card.Description>
	</Card.Header>
	<Card.Content>
		<form onsubmit={handleSubmit}>
			<FieldGroup>
				<Field data-invalid={Boolean(apiError)}>
					<FieldLabel for="email-{id}">Email</FieldLabel>
					<Input
						id="email-{id}"
						type="email"
						placeholder="m@example.com"
						bind:value={form.email}
						aria-invalid={Boolean(apiError)}
						required
					/>
				</Field>
				<Field data-invalid={Boolean(apiError)}>
					<div class="flex items-center">
						<FieldLabel for="password-{id}">Password</FieldLabel>
							<a href={resolve(appRoutePath.auth.forgotPassword)} class="ml-auto inline-block text-sm underline">
							Forgot your password?
						</a>
					</div>
					<Input
						id="password-{id}"
						type="password"
						bind:value={form.password}
						aria-invalid={Boolean(apiError)}
						required
					/>
					{#if apiError}
						<FieldError>{apiError}</FieldError>
					{/if}
				</Field>
				<Field>
					<Button type="submit" class="w-full" disabled={isLoading} aria-busy={isLoading}>
						{#if isLoading}
							<span class="sr-only">Logging in</span>
							<span class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
							Logging in…
						{:else}
							Login
						{/if}
					</Button>
					<Button onclick={handleGoogleLogin} variant="outline" class="w-full" type="button" disabled={isLoading}>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
							<path
								d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
								fill="currentColor"
							/>
						</svg>
						Login with Google
					</Button>
					
					{#if apiSuccess}
						<FieldDescription class="text-center text-emerald-600 dark:text-emerald-400">
							{apiSuccess}
						</FieldDescription>
					{/if}
						<FieldDescription class="text-center">
							Don't have an account? <a href={resolve(appRoutePath.auth.register)}>Sign up</a>
						</FieldDescription>
				</Field>
			</FieldGroup>
		</form>
	</Card.Content>
</Card.Root>
