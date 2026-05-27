<script lang="ts">
	import {
		ArrowLeft01Icon,
		ArrowRight01Icon,
		Clock,
		Delete01Icon,
		Down,
		Download01Icon,
		Tick01Icon,
		VolumeHighIcon,
		VolumeMute01Icon
	} from '@hugeicons/core-free-icons';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Select } from 'bits-ui';
	import { onDestroy, onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { toast } from 'svelte-sonner';
	import { browser } from '$app/environment';
	import { invalidateAll } from '$app/navigation';
	import SEO from '$lib/components/self/SEO.svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Pagination from '$lib/components/ui/pagination';
	import { Slider } from '$lib/components/ui/slider';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import { MAX_FILE_SIZE } from '$lib/data/constants';
	import { haptic } from '$lib/stores/haptics';
	import { USER_DATA } from '$lib/stores/user-data';
	import { volumeSettings } from '$lib/stores/volume-settings';
	import { debounce, getPublicUrl } from '$lib/utils';
	import { formatTimezone, timezoneList } from '$lib/utils/timezones';

	let shouldSignIn = $state(false);
	let name = $state($USER_DATA?.name || '');
	let bio = $state($USER_DATA?.bio ?? '');
	let username = $state($USER_DATA?.username || '');
	let timezone = $state($USER_DATA?.timezone?.toString() || '0');
	let initialUsername = $USER_DATA?.username || '';
	let avatarFile: FileList | undefined = $state(undefined);

	let previewUrl: string | null = $state(null);
	const currentAvatarUrl = $derived(previewUrl || getPublicUrl($USER_DATA?.image ?? null));

	let nameError = $state('');

	const isDirty = $derived(
		name !== ($USER_DATA?.name || '') ||
			bio !== ($USER_DATA?.bio ?? '') ||
			username !== ($USER_DATA?.username || '') ||
			avatarFile !== undefined ||
			+timezone !== ($USER_DATA?.timezone || 0)
	);

	let fileInput: HTMLInputElement | undefined = $state(undefined);

	let loading = $state(false);
	let usernameAvailable: boolean | null = $state(null);
	let checkingUsername = $state(false);
	let masterVolume = $state(($USER_DATA?.volumeMaster || 0) * 100);
	let isMuted = $state($USER_DATA?.volumeMuted || false);

	let deleteDialogOpen = $state(false);
	let deleteConfirmationText = $state('');
	let isDeleting = $state(false);
	let isDownloading = $state(false);
	let disableMentions = $state($USER_DATA?.disableMentions || false);

	// Blocked users state
	let blockedUsers = $state<
		Array<{
			id: number;
			blockedId: number;
			username: string;
			name: string;
			image: string | null;
			createdAt: string;
		}>
	>([]);
	let blockedLoading = $state(false);
	let unblockingUser = $state<string | null>(null);
	let blockedPage = $state(1);
	const blockedPerPage = 10;
	const blockedTotalPages = $derived(Math.ceil(blockedUsers.length / blockedPerPage));
	const paginatedBlocked = $derived(
		blockedUsers.slice((blockedPage - 1) * blockedPerPage, blockedPage * blockedPerPage)
	);

	async function loadBlockedUsers() {
		blockedLoading = true;
		try {
			const res = await fetch('/api/settings/blocked');
			if (res.ok) {
				const data = await res.json();
				blockedUsers = data.blocks ?? [];
			} else {
				toast.error($_('settings.blocked_users.load_failed'));
			}
		} catch {
			toast.error($_('settings.blocked_users.load_failed'));
		}
		blockedLoading = false;
	}

	async function unblockUser(username: string) {
		unblockingUser = username;
		try {
			const res = await fetch(`/api/user/${username}/block`, {
				method: 'DELETE'
			});
			if (res.ok) {
				blockedUsers = blockedUsers.filter((b) => b.username !== username);
				toast.success($_('settings.blocked_users.unblock_success', { values: { username } }));
			} else {
				toast.error($_('settings.blocked_users.unblock_failed'));
			}
		} catch {
			toast.error($_('settings.blocked_users.unblock_failed'));
		}
		unblockingUser = null;
	}

	function beforeUnloadHandler(e: BeforeUnloadEvent) {
		if (isDirty) {
			e.preventDefault();
		}
	}

	onMount(() => {
		window.addEventListener('beforeunload', beforeUnloadHandler);
		volumeSettings.setMaster($USER_DATA?.volumeMaster || 0);
		volumeSettings.setMuted($USER_DATA?.volumeMuted || false);
		loadBlockedUsers();
	});

	onDestroy(() => {
		window.removeEventListener('beforeunload', beforeUnloadHandler);
	});

	function handleAvatarClick() {
		fileInput?.click();
	}
	function handleAvatarChange(e: Event) {
		const f = (e.target as HTMLInputElement).files?.[0];
		if (f) {
			// Check file size
			if (f.size > MAX_FILE_SIZE) {
				toast.error($_('settings.profile_settings.profile_picture_large'));
				(e.target as HTMLInputElement).value = '';
				return;
			}

			// Check file type
			if (!f.type.startsWith('image/')) {
				toast.error($_('settings.profile_settings.invalid_image'));
				(e.target as HTMLInputElement).value = '';
				return;
			}

			previewUrl = URL.createObjectURL(f);
			const files = (e.target as HTMLInputElement).files;
			if (files) avatarFile = files;
		}
	}

	const checkUsername = debounce(async (val: string) => {
		if (val.length < 3) return (usernameAvailable = null);
		checkingUsername = true;
		const res = await fetch(`/api/settings/check-username?username=${val}`);
		usernameAvailable = (await res.json()).available;
		checkingUsername = false;
	}, 500);

	$effect(() => {
		if (username !== initialUsername) checkUsername(username);
	});

	$effect(() => {
		validateName();
	});

	function validateName() {
		if (!name.trim()) {
			nameError = $_('settings.profile_settings.display_name_required');
		} else if (name.trim().length < 2) {
			nameError = $_('settings.profile_settings.display_name_min');
		} else if (name.trim().length > 50) {
			nameError = $_('settings.profile_settings.display_name_max');
		} else {
			nameError = '';
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;

		try {
			const fd = new FormData();
			fd.append('name', name.trim());
			fd.append('bio', bio);
			fd.append('username', username);
			fd.append('timezone', timezone);
			if (avatarFile?.[0]) fd.append('avatar', avatarFile[0]);

			const res = await fetch('/api/settings', { method: 'POST', body: fd });

			if (res.ok) {
				await invalidateAll();
				haptic.trigger('success');
				toast.success($_('settings.profile_settings.success_message'), {
					action: {
						label: $_('settings.profile_settings.success_refresh'),
						onClick: () => window.location.reload()
					}
				});
			} else {
				const result = await res.json();
				toast.error($_('settings.profile_settings.error_message'), {
					description: result.message || $_('settings.profile_settings.unexpected_error')
				});
			}
		} catch (error) {
			toast.error($_('settings.profile_settings.error_message'), {
				description: $_('settings.profile_settings.unexpected_error')
			});
		} finally {
			loading = false;
		}
	}

	const debouncedSaveVolume = debounce(async (settings: { master: number; muted: boolean }) => {
		try {
			const response = await fetch('/api/settings/volume', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(settings)
			});

			if (!response.ok) {
				throw new Error('Failed to save volume settings');
			}
		} catch (error) {
			console.error('Failed to save volume settings:', error);
			toast.error($_('settings.audio_settings.volume_hint'));
		}
	}, 500);

	async function saveVolumeToServer(settings: { master: number; muted: boolean }) {
		debouncedSaveVolume(settings);
	}

	async function toggleDisableMentions() {
		disableMentions = !disableMentions;
		haptic.trigger('light');
		try {
			const response = await fetch('/api/settings/mentions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ disableMentions })
			});
			if (!response.ok) {
				disableMentions = !disableMentions;
				toast.error($_('settings.notification_settings.mentions_description'));
			}
		} catch {
			disableMentions = !disableMentions;
			toast.error($_('settings.notification_settings.mentions_description'));
		}
	}

	function handleMasterVolumeChange(value: number) {
		masterVolume = value;
		const normalizedValue = value / 100;
		volumeSettings.setMaster(normalizedValue);
		saveVolumeToServer({ master: normalizedValue, muted: isMuted });
	}
	function toggleMute() {
		isMuted = !isMuted;
		haptic.trigger('light');
		volumeSettings.setMuted(isMuted);
		saveVolumeToServer({ master: masterVolume / 100, muted: isMuted });
	}

	async function downloadUserData() {
		isDownloading = true;
		try {
			const headResponse = await fetch('/api/settings/data-download', {
				method: 'HEAD'
			});

			if (!headResponse.ok) {
				throw new Error('Download service unavailable');
			}

			const contentLength = headResponse.headers.get('Content-Length');
			if (contentLength) {
				const sizeInMB = parseInt(contentLength) / (1024 * 1024);
				if (sizeInMB > 50) {
					const proceed = confirm(
						$_('settings.data_privacy.download_size_confirm', {
							values: { size: sizeInMB.toFixed(1) }
						})
					);
					if (!proceed) {
						isDownloading = false;
						return;
					}
				}
			}

			const downloadUrl = '/api/settings/data-download';

			const downloadWindow = window.open(downloadUrl, '_blank');

			if (!downloadWindow || downloadWindow.closed) {
				const a = document.createElement('a');
				a.href = downloadUrl;
				a.style.display = 'none';
				a.target = '_blank';
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
			} else {
				setTimeout(() => {
					try {
						downloadWindow.close();
					} catch (e) {}
				}, 1000);
			}

			toast.success($_('settings.data_privacy.download_started'));
		} catch (error) {
			console.error('Download error:', error);
			toast.error(
				$_('settings.data_privacy.download_failed', {
					values: { error: (error as Error).message }
				})
			);
		} finally {
			isDownloading = false;
		}
	}

	async function deleteAccount() {
		if (deleteConfirmationText !== $_('settings.data_privacy.delete_confirmation_placeholder')) {
			haptic.trigger('error');
			toast.error($_('settings.data_privacy.delete_confirm_type_error'));
			return;
		}

		isDeleting = true;
		try {
			const response = await fetch('/api/settings/delete-account', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					confirmationText: deleteConfirmationText
				})
			});

			const result = await response.json();

			if (!response.ok) {
				if (response.status === 409) {
					toast.error($_('settings.data_privacy.delete_already_scheduled'), {
						description: $_('settings.data_privacy.delete_already_scheduled_desc')
					});
				} else {
					throw new Error(result.message || 'Failed to delete account');
				}
			} else {
				toast.success($_('settings.data_privacy.delete_scheduled'), {
					description: result.message
				});
			}
		} catch (error: any) {
			console.error('Delete account error:', error);
			toast.error(
				$_('settings.data_privacy.delete_failed', {
					values: { error: error.message }
				})
			);
		} finally {
			isDeleting = false;
			deleteDialogOpen = false;
			deleteConfirmationText = '';
		}
	}
</script>

<SEO
	title="{$_('settings.title')} - BooPlay"
	description={$_('settings.seo_description')}
	keywords={$_('settings.seo_keywords')}
/>

<div class="container mx-auto max-w-2xl p-6">
	<h1 class="mb-6 text-2xl font-bold">{$_('settings.title')}</h1>

	{#if !$USER_DATA}
		<div class="flex h-96 items-center justify-center">
			<div class="text-center">
				<div class="text-muted-foreground mb-4 text-xl">
					{$_('settings.not_logged_in')}
				</div>
				<Button onclick={() => (shouldSignIn = true)}>{$_('settings.sign_in_button')}</Button>
			</div>
		</div>
	{:else}
		<div class="space-y-6">
			<Card.Root>
				<Card.Header>
					<Card.Title>{$_('settings.profile_settings.title')}</Card.Title>
					<Card.Description>{$_('settings.profile_settings.description')}</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="mb-6 flex items-center gap-4">
						<div
							class="group relative cursor-pointer"
							role="button"
							tabindex="0"
							onclick={handleAvatarClick}
							onkeydown={(e) => e.key === 'Enter' && handleAvatarClick()}
						>
							<Avatar.Root class="size-20">
								<Avatar.Image src={currentAvatarUrl} alt={name} />
								<Avatar.Fallback>?</Avatar.Fallback>
							</Avatar.Root>
							<div
								class="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
							>
								<span class="text-xs text-white"
									>{$_('settings.profile_settings.avatar_change_text')}</span
								>
							</div>
						</div>
						<div>
							<h3 class="text-lg font-semibold">{name}</h3>
							<p class="text-muted-foreground text-sm">@{username}</p>
						</div>
					</div>

					<input
						type="file"
						accept="image/*"
						class="hidden"
						bind:this={fileInput}
						onchange={handleAvatarChange}
					/>

					<form onsubmit={handleSubmit} class="space-y-4">
						<div class="space-y-2">
							<Label for="name">{$_('settings.profile_settings.display_name_label')}</Label>
							<Input
								id="name"
								bind:value={name}
								required
								class={nameError ? 'border-destructive' : ''}
							/>
							{#if nameError}
								<p class="text-destructive text-sm">{nameError}</p>
							{/if}
						</div>

						<div class="space-y-2">
							<Label for="username">{$_('settings.profile_settings.username_label')}</Label>
							<div class="relative">
								<span class="text-muted-foreground absolute top-4 left-3 -translate-y-1/2 transform"
									>@</span
								>
								<Input
									id="username"
									bind:value={username}
									required
									pattern={'^[a-zA-Z0-9_]{3,30}$'}
									class="pl-8"
								/>
								<div class="absolute top-1.5 right-3">
									{#if checkingUsername}
										<span class="text-muted-foreground text-sm"
											>{$_('settings.profile_settings.username_checking')}</span
										>
									{:else if username !== initialUsername}
										{#if usernameAvailable}
											<HugeiconsIcon icon={Tick01Icon} class="text-success" />
										{:else}
											<span class="text-destructive text-sm"
												>{$_('settings.profile_settings.username_taken')}</span
											>
										{/if}
									{/if}
								</div>
							</div>
							<p class="text-muted-foreground text-xs">
								{$_('settings.profile_settings.username_hint')}
							</p>
						</div>

						<div class="space-y-2">
							<Label for="bio">{$_('settings.profile_settings.bio_label')}</Label>
							<Textarea
								id="bio"
								bind:value={bio}
								rows={4}
								placeholder={$_('settings.profile_settings.bio_placeholder')}
							/>
						</div>

						<div class="space-y-2">
							<Label for="bio">{$_('settings.profile_settings.timezone_label')}</Label>
							<Select.Root
								type="single"
								bind:value={timezone}
								onValueChange={(v) => (timezone = v)}
							>
								<Select.Trigger
									class="focus-visible:ring-primary/50 flex w-full items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 text-sm shadow-sm transition hover:shadow-md focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800"
								>
									{formatTimezone(+timezone)}
									<HugeiconsIcon icon={Down} class="h-4 w-4" />
								</Select.Trigger>
								<Select.Content
									class="bg-popover text-popover-foreground relative z-50 max-h-56 min-w-[12rem] divide-y overflow-x-hidden overflow-y-auto rounded-md border shadow-lg"
								>
									<Select.Group>
										{#each timezoneList as timezone}
											<Select.Item
												value={timezone.toString()}
												label={formatTimezone(timezone)}
												class="hover:bg-accent/5 data-[state=checked]:bg-primary/10 flex cursor-pointer items-center gap-2 px-3 py-2 text-sm"
											>
												<HugeiconsIcon icon={Clock} class="text-muted-foreground h-4 w-4" />
												<span class="truncate">{formatTimezone(timezone)}</span>
											</Select.Item>
										{/each}
									</Select.Group>
								</Select.Content>
							</Select.Root>
						</div>

						<Button type="submit" disabled={loading || !isDirty || !!nameError}>
							{loading
								? $_('settings.profile_settings.saving_button')
								: $_('settings.profile_settings.save_changes_button')}
						</Button>
					</form>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>{$_('settings.audio_settings.title')}</Card.Title>
					<Card.Description>{$_('settings.audio_settings.description')}</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<Label class="text-base font-medium"
								>{$_('settings.audio_settings.volume_label')}</Label
							>
							<div class="flex items-center gap-2">
								<Button variant="ghost" size="sm" onclick={toggleMute} class="h-8 w-8 p-0">
									{#if isMuted}
										<HugeiconsIcon icon={VolumeMute01Icon} class="h-4 w-4" />
									{:else}
										<HugeiconsIcon icon={VolumeHighIcon} class="h-4 w-4" />
									{/if}
								</Button>
								<span class="text-muted-foreground w-10 text-right text-sm"
									>{Math.round(masterVolume)}%</span
								>
							</div>
						</div>
						{#if browser}
							<Slider
								type="single"
								value={masterVolume}
								onValueChange={handleMasterVolumeChange}
								max={100}
								step={1}
								disabled={isMuted}
							/>
						{:else}
							<!-- Fallback slider for SSR -->
							<div class="relative flex w-full touch-none items-center select-none">
								<div class="bg-secondary relative h-2 w-full grow overflow-hidden rounded-full">
									<div
										class="bg-primary absolute h-full transition-all"
										style="width: {masterVolume}%"
									></div>
								</div>
							</div>
						{/if}
						<p class="text-muted-foreground text-xs">
							{$_('settings.audio_settings.volume_hint')}
						</p>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>{$_('settings.notification_settings.title')}</Card.Title>
					<Card.Description>{$_('settings.notification_settings.description')}</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div class="flex items-center justify-between rounded-lg border p-4">
						<div class="space-y-1">
							<h4 class="text-sm font-medium">
								{$_('settings.notification_settings.mentions_title')}
							</h4>
							<p class="text-muted-foreground text-xs">
								{$_('settings.notification_settings.mentions_description')}
							</p>
						</div>
						<Switch checked={!disableMentions} onCheckedChange={toggleDisableMentions} />
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>{$_('settings.blocked_users.title')}</Card.Title>
					<Card.Description>{$_('settings.blocked_users.description')}</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-2">
					{#if blockedLoading}
						<p class="text-muted-foreground text-sm">{$_('settings.blocked_users.loading')}</p>
					{:else if blockedUsers.length === 0}
						<p class="text-muted-foreground text-sm">{$_('settings.blocked_users.no_blocked')}</p>
					{:else}
						{#each paginatedBlocked as blocked}
							<div class="flex items-center justify-between rounded-lg border p-3">
								<div class="flex items-center gap-3">
									<a href="/user/{blocked.username}" class="font-medium hover:underline"
										>@{blocked.username}</a
									>
								</div>
								<Button
									variant="outline"
									size="sm"
									onclick={() => unblockUser(blocked.username)}
									disabled={unblockingUser === blocked.username}
								>
									{unblockingUser === blocked.username
										? $_('settings.blocked_users.unblocking_button')
										: $_('settings.blocked_users.unblock_button')}
								</Button>
							</div>
						{/each}
						{#if blockedTotalPages > 1}
							<div class="mt-4 flex justify-center">
								<Pagination.Root
									count={blockedUsers.length}
									perPage={blockedPerPage}
									siblingCount={1}
									page={blockedPage}
									onPageChange={(page) => {
										blockedPage = page;
									}}
								>
									{#snippet children({ pages, currentPage: paginationCurrentPage })}
										<Pagination.Content>
											<Pagination.Item>
												<Pagination.PrevButton>
													<HugeiconsIcon icon={ArrowLeft01Icon} class="h-4 w-4" />
												</Pagination.PrevButton>
											</Pagination.Item>
											{#each pages as page (page.key)}
												{#if page.type === 'ellipsis'}
													<Pagination.Item>
														<Pagination.Ellipsis />
													</Pagination.Item>
												{:else}
													<Pagination.Item>
														<Pagination.Link {page} isActive={paginationCurrentPage === page.value}>
															{page.value}
														</Pagination.Link>
													</Pagination.Item>
												{/if}
											{/each}
											<Pagination.Item>
												<Pagination.NextButton>
													<HugeiconsIcon icon={ArrowRight01Icon} class="h-4 w-4" />
												</Pagination.NextButton>
											</Pagination.Item>
										</Pagination.Content>
									{/snippet}
								</Pagination.Root>
							</div>
						{/if}
					{/if}
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>{$_('settings.data_privacy.title')}</Card.Title>
					<Card.Description>{$_('settings.data_privacy.description')}</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div class="space-y-4">
						<div class="flex items-center justify-between rounded-lg border p-4">
							<div class="space-y-1">
								<h4 class="text-sm font-medium">{$_('settings.data_privacy.download_title')}</h4>
								<p class="text-muted-foreground text-xs">
									{$_('settings.data_privacy.download_description')}
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								onclick={downloadUserData}
								disabled={isDownloading}
								class="ml-4"
							>
								<HugeiconsIcon icon={Download01Icon} class="h-4 w-4" />
								{isDownloading
									? $_('settings.data_privacy.downloading_button')
									: $_('settings.data_privacy.download_button')}
							</Button>
						</div>

						<div
							class="border-destructive/20 bg-destructive/5 flex items-center justify-between rounded-lg border p-4"
						>
							<div class="space-y-1">
								<h4 class="text-destructive text-sm font-medium">
									{$_('settings.data_privacy.delete_title')}
								</h4>
								<p class="text-muted-foreground text-xs">
									{$_('settings.data_privacy.delete_description')}
								</p>
							</div>
							<Button
								variant="destructive"
								size="sm"
								onclick={() => (deleteDialogOpen = true)}
								class="ml-4"
							>
								<HugeiconsIcon icon={Delete01Icon} class="h-4 w-4" />
								{$_('settings.data_privacy.delete_button')}
							</Button>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	{/if}
</div>

<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="text-destructive"
				>{$_('settings.data_privacy.delete_modal_title')}</Dialog.Title
			>
			<Dialog.Description>
				{@html $_('settings.data_privacy.delete_modal_description', {
					values: { days: '14' }
				}).replace(/{{days}}/g, '<span class="font-semibold">14</span>')}
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4">
			<div class="bg-destructive/10 rounded-lg p-4">
				<h4 class="mb-2 text-sm font-medium">{$_('settings.data_privacy.delete_what_happens')}</h4>
				<ul class="text-muted-foreground space-y-1 text-xs">
					<li>{$_('settings.data_privacy.delete_list_profile')}</li>
					<li>{$_('settings.data_privacy.delete_list_logout')}</li>
					<li>{$_('settings.data_privacy.delete_list_anonymize')}</li>
					<li>{$_('settings.data_privacy.delete_list_transactions')}</li>
					<li>{$_('settings.data_privacy.delete_list_recovery')}</li>
				</ul>
			</div>
			<div class="space-y-2">
				<Label for="delete-confirmation"
					>{$_('settings.data_privacy.delete_confirmation_label')}</Label
				>
				<Input
					id="delete-confirmation"
					bind:value={deleteConfirmationText}
					placeholder={$_('settings.data_privacy.delete_confirmation_placeholder')}
					class="font-mono"
				/>
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (deleteDialogOpen = false)}
				>{$_('settings.data_privacy.delete_cancel_button')}</Button
			>
			<Button
				variant="destructive"
				onclick={deleteAccount}
				disabled={isDeleting ||
					deleteConfirmationText !== $_('settings.data_privacy.delete_confirmation_placeholder')}
			>
				{isDeleting
					? $_('settings.data_privacy.deleting_button')
					: $_('settings.data_privacy.delete_confirm_button')}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
