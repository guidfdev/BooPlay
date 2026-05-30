<script lang="ts">
	import { DiscordIcon, GoogleIcon } from '@hugeicons/core-free-icons';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { Icon } from 'svelte-sonner';
	import { page } from '$app/state';
	import { signIn } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';

	let discordAvailable = $state(false);
	let googleAvailable = $state(false);
	let loading = $state(true);

	onMount(async () => {
		try {
			const response = await fetch('/api/auth-providers');
			const providers = await response.json();
			discordAvailable = providers.discord;
			googleAvailable = providers.google;
		} catch (error) {
			console.error('Failed to fetch auth providers:', error);
		} finally {
			loading = false;
		}
	});

	async function onConfirmDiscord() {
		await signIn.social({
			provider: 'discord',
			callbackURL: `${page.url.pathname}?signIn=1`
		});
	}

	async function onConfirmGoogle() {
		await signIn.social({
			provider: 'google',
			callbackURL: `${page.url.pathname}?signIn=1`
		});
	}

	let { open = $bindable(false) } = $props<{
		open?: boolean;
	}>();
</script>

<Dialog bind:open>
	<DialogContent class="sm:max-w-md">
		<DialogHeader>
			<DialogTitle>{$_('sign_in.form.title')}</DialogTitle>
			<DialogDescription>
				{$_('sign_in.form.description')}
			</DialogDescription>
		</DialogHeader>
		<div class="flex flex-col gap-4 py-2">
			{#if !loading}
				{#if googleAvailable}
					<Button
						class="flex w-full items-center justify-center gap-2"
						variant="outline"
						onclick={() => onConfirmGoogle()}
					>
						<HugeiconsIcon icon={GoogleIcon} />
						<span>{$_('sign_in.form.services.google')}</span>
					</Button>
				{/if}
				{#if discordAvailable}
					<Button
						class="flex w-full items-center justify-center gap-2"
						variant="outline"
						onclick={() => onConfirmDiscord()}
					>
						<HugeiconsIcon icon={DiscordIcon} />
						<span>{$_('sign_in.form.services.discord')}</span>
					</Button>
				{/if}
			{/if}

			<p class="text-muted-foreground text-center text-xs">
				{$_('sign_in.form.terms.0')}
				<a href="/legal/terms" class="text-primary hover:underline">{$_('sign_in.form.terms.1')}</a>
				{$_('sign_in.form.terms.2')}
				<a href="/legal/privacy" class="text-primary hover:underline"
					>{$_('sign_in.form.terms.3')}</a
				>
			</p>
		</div>
	</DialogContent>
</Dialog>
