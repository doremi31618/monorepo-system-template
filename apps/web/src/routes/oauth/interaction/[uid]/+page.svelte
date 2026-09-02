<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { authStore } from '$lib/store/authStore';
  import * as authApi from '$lib/api/auth';
  import {
    approveOAuthConsent,
    denyOAuthConsent,
    getInteraction,
    resumeOAuthLogin,
    type OAuthInteractionDetails,
  } from '$lib/api/oauth';
  import { Button } from '@platform/svelte-ui/button';
  import * as Card from '@platform/svelte-ui/card';
  import { Input } from '@platform/svelte-ui/input';
  import { Badge } from '@platform/svelte-ui/badge';
  import { Field, FieldError, FieldGroup, FieldLabel } from '@platform/svelte-ui/field';
  import { AppConfig } from '$lib/config';

  const uid = $derived(page.params.uid ?? '');
  let details = $state<OAuthInteractionDetails | null>(null);
  let loading = $state(true);
  let submitting = $state(false);
  let error = $state('');
  let hasSession = $state(false);
  let email = $state('');
  let password = $state('');

  onMount(async () => {
    try {
      const [response, session] = await Promise.all([
        getInteraction(uid),
        authStore.getToken(),
      ]);
      details = response.data ?? null;
      hasSession = Boolean(session);
      if (!details) error = 'This authorization request is no longer available.';
    } catch {
      error = 'This authorization request is invalid or has expired.';
    } finally {
      loading = false;
    }
  });

  function follow(response: { data?: { redirectTo?: string } | null }) {
    const redirectTo = response.data?.redirectTo;
    if (!redirectTo) throw new Error('Authorization response is missing its continuation URL');
    window.location.assign(redirectTo);
  }

  async function continueLogin() {
    submitting = true;
    error = '';
    try {
      follow(await resumeOAuthLogin(uid));
    } catch {
      error = 'Your session could not be used. Please sign in again.';
      hasSession = false;
      submitting = false;
    }
  }

  async function login(event: SubmitEvent) {
    event.preventDefault();
    submitting = true;
    error = '';
    try {
      const response = await authApi.login(email, password);
      if (!response.data) throw new Error('No session returned');
      authStore.setSession(response.data);
      hasSession = true;
      if (details?.prompt === 'login') {
        follow(await resumeOAuthLogin(uid));
        return;
      }
      submitting = false;
    } catch {
      error = 'Email or password is incorrect.';
      submitting = false;
    }
  }

  async function decide(allow: boolean) {
    submitting = true;
    error = '';
    try {
      follow(allow ? await approveOAuthConsent(uid) : await denyOAuthConsent(uid));
    } catch {
      error = 'We could not complete this authorization request. Please try again.';
      submitting = false;
    }
  }

  function googleLogin() {
    const returnTo = `/oauth/interaction/${uid}`;
    window.location.assign(
      `${AppConfig.apiBaseUrl}/auth/google/login?returnTo=${encodeURIComponent(returnTo)}`,
    );
  }
</script>

<svelte:head><title>Authorize application</title></svelte:head>

<main class="bg-muted/30 flex min-h-svh items-center justify-center p-4 sm:p-8">
  <Card.Root class="w-full max-w-lg shadow-lg">
    <Card.Header>
      <div class="mb-2 flex items-center justify-between gap-4">
        <Badge variant="secondary">Secure authorization</Badge>
        <span class="text-muted-foreground text-xs">OAuth 2.1</span>
      </div>
      <Card.Title>{details?.client.name ?? 'Authorization request'}</Card.Title>
      <Card.Description>
        Review who is requesting access and where you will return.
      </Card.Description>
    </Card.Header>

    <Card.Content class="space-y-5">
      {#if loading}
        <p class="text-muted-foreground" aria-live="polite">Loading authorization request…</p>
      {:else if details}
        <dl class="grid gap-3 rounded-lg border p-4 text-sm">
          <div>
            <dt class="text-muted-foreground">Application</dt>
            <dd class="font-medium">{details.client.name}</dd>
          </div>
          <div>
            <dt class="text-muted-foreground">Callback</dt>
            <dd class="break-all font-mono text-xs">{details.redirectUri}</dd>
          </div>
          {#each details.resources as resource (resource)}
            <div>
              <dt class="text-muted-foreground">Resource</dt>
              <dd class="break-all font-mono text-xs">{resource}</dd>
            </div>
          {/each}
        </dl>

        <section aria-labelledby="requested-access">
          <h2 id="requested-access" class="mb-2 text-sm font-semibold">Requested access</h2>
          <ul class="flex flex-wrap gap-2">
            {#each details.scopes as scope (scope)}
              <li><Badge variant="outline">{scope}</Badge></li>
            {/each}
          </ul>
        </section>

        {#if !hasSession}
          <form onsubmit={login}>
            <FieldGroup>
              <Field>
                <FieldLabel for="oauth-email">Email</FieldLabel>
                <Input id="oauth-email" type="email" bind:value={email} autocomplete="email" required />
              </Field>
              <Field>
                <FieldLabel for="oauth-password">Password</FieldLabel>
                <Input id="oauth-password" type="password" bind:value={password} autocomplete="current-password" required />
              </Field>
              <Button class="w-full" type="submit" disabled={submitting}>Sign in and continue</Button>
              <Button class="w-full" type="button" variant="outline" disabled={submitting} onclick={googleLogin}>
                Continue with Google
              </Button>
            </FieldGroup>
          </form>
        {:else if details.prompt === 'login'}
          <Button class="w-full" disabled={submitting} onclick={continueLogin}>
            Continue with your signed-in account
          </Button>
        {:else if details.prompt === 'consent'}
          <div class="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" disabled={submitting} onclick={() => decide(false)}>Deny</Button>
            <Button disabled={submitting} onclick={() => decide(true)}>Allow access</Button>
          </div>
        {/if}
      {/if}

      {#if error}
        <Field data-invalid="true"><FieldError>{error}</FieldError></Field>
      {/if}
    </Card.Content>
  </Card.Root>
</main>
