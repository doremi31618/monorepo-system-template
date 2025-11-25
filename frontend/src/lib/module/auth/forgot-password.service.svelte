<script lang="ts" module>
    // otp form
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import * as InputOTP from "$lib/components/ui/input-otp/index.js";
	// import type { ComponentProps } from "svelte";

	// let { ...props }: ComponentProps<typeof Card.Root> = $props();
</script>


<script lang="ts">
    // forgot password form
	import GalleryVerticalEndIcon from "@lucide/svelte/icons/gallery-vertical-end";
	import type { HTMLAttributes } from "svelte/elements";
	// import {
	// 	FieldGroup,
	// 	Field,
	// 	FieldLabel,
	// 	FieldDescription,
	// 	FieldSeparator,
	// } from "$lib/components/ui/field/index.js";
    import { page } from "$app/stores";
    import { authStore } from "$lib/store/authStore";
	import { Input } from "$lib/components/ui/input/index.js";
	// import { Button } from "$lib/components/ui/button/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();

	const id = $props.id();

    let emailParam = $page.url.searchParams.get('email');
    let email = $state(emailParam || '');

    let isLoading = $state(false);

    // async function forgotPassword(email: string) {
    //     const response = await authStore.forgotPassword(email);
    //     return response.data;
    // }

    async function handleSubmit(event: Event) {
        event.preventDefault();
        isLoading = true;
        // await forgotPassword(email);
        // isLoading = false;
        // if (response.success) {
        //     navigate(appRoutePath.auth.login);
        // }
    }
</script>

{#if isLoading}
<Card.Root >
	<Card.Header>
		<Card.Title>Enter verification code</Card.Title>
		<Card.Description>We sent a 6-digit code to {email}</Card.Description>
	</Card.Header>
	<Card.Content>
		<form>
			<Field.Group>
				<Field.Field>
					<Field.Label for="otp">Verification code</Field.Label>
					<InputOTP.Root maxlength={6} id="otp" required>
						{#snippet children({ cells })}
							<InputOTP.Group
								class="gap-2.5 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border"
							>
								{#each cells as cell (cell)}
									<InputOTP.Slot {cell} />
								{/each}
							</InputOTP.Group>
						{/snippet}
					</InputOTP.Root>
					<Field.Description>
						Enter the 6-digit code sent to your email.
					</Field.Description>
				</Field.Field>
				<Field.Group>
					<Button type="submit">Verify</Button>
					<Field.Description class="text-center">
						Didn't receive the code? <a href="#/">Resend</a>
					</Field.Description>
				</Field.Group>
			</Field.Group>
		</form>
	</Card.Content>
</Card.Root>
{:else}
<div class={cn("flex flex-col gap-6", className)} bind:this={ref} {...restProps}>
	<form>
		<Field.Group>
			<div class="flex flex-col items-center gap-2 text-center">
				<a href="##" class="flex flex-col items-center gap-2 font-medium">
					<div class="flex size-8 items-center justify-center rounded-md">
						<GalleryVerticalEndIcon class="size-6" />
					</div>
					<span class="sr-only">Acme Inc.</span>
				</a>
				<h1 class="text-xl font-bold">Forgot Password</h1>
				<Field.Description>
					To reset your password, enter your email below.
				</Field.Description>
			</div>
			<Field.Field>
				<Field.Label for="email-{id}">Email</Field.Label>
				<Input id="email-{id}" bind:value={email} type="email" placeholder="m@example.com" required />
			</Field.Field>
			<Field.Field>
				<Button type="submit" onclick={handleSubmit}>Send</Button>
			</Field.Field>
			
		</Field.Group>
	</form>
</div>
{/if}