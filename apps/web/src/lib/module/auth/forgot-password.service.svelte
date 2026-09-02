<script lang="ts" module>
    // otp form
	import { Button } from "@platform/svelte-ui/button";
	import * as Card from "@platform/svelte-ui/card";
	import * as Field from "@platform/svelte-ui/field";
	import * as InputOTP from "@platform/svelte-ui/input-otp";
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
	// } from "@platform/svelte-ui/field";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import * as authApi from "$lib/api/auth";
    import { Input } from "@platform/svelte-ui/input";
	// import { Button } from "@platform/svelte-ui/button";
	import { cn, type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();

	const id = $props.id();

    let emailParam = $page.url.searchParams.get('email');
    let email = $state(emailParam || '');
    let resetToken: string | null = $state(null);
    let resetLink: string | null = $state(null);
    let expiresAt: string | null = $state(null);
    let isLoading = $state(false);
    let errorMsg: string | null = $state(null);
    let successMsg: string | null = $state(null);

    async function handleSubmit(event: Event) {
        event.preventDefault();
        isLoading = true;
        errorMsg = null;
        try {
            const res = await authApi.requestPasswordReset(email);
            if (res.statusCode !== 201 && res.statusCode !== 200) {
                throw new Error(res.message ?? 'Request failed');
            }
            resetToken = res.data?.token ?? null;
            expiresAt = res.data?.expiresAt ?? null;
            resetLink = res.data?.resetLink ?? (resetToken ? `/auth/reset?token=${resetToken}` : null);
            successMsg = "If an account exists, we've sent a reset link to your email.";
        } catch (err) {
            errorMsg = (err as Error)?.message ?? 'Failed to request reset';
        } finally {
            isLoading = false;
        }
    }
</script>

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
			{#if errorMsg}
				<Field.Description class="text-destructive">{errorMsg}</Field.Description>
			{/if}
			<Field.Field>
				<Button type="submit" onclick={handleSubmit} disabled={isLoading}>
					{#if isLoading}Sending...{:else}Send{/if}
				</Button>
			</Field.Field>
			{#if successMsg}
				<Field.Description class="text-sm text-muted-foreground">
					{successMsg}
				</Field.Description>
			{/if}
			{#if resetLink}
				<Field.Description class="text-xs text-muted-foreground">
					Dev link (valid until {expiresAt ?? 'soon'}): <a class="text-primary underline" href={resetLink}>{resetLink}</a>
				</Field.Description>
			{/if}
			
		</Field.Group>
	</form>
</div>
