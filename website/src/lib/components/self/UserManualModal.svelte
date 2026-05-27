<script lang="ts">
	import {
		ArrowLeft01Icon,
		ArrowRight01Icon,
		Award01Icon,
		BarChartIcon,
		BookOpen01Icon,
		Coins01Icon,
		DiceFaces01Icon,
		Target01Icon,
		TradeDownIcon,
		TradeUpIcon
	} from '@hugeicons/core-free-icons';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { _ } from 'svelte-i18n';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';

	let { open = $bindable(false) } = $props<{
		open?: boolean;
	}>();

	interface Tip {
		id: number;
		titleKey?: string;
		descriptionKey?: string;
		image?: string;
		icon: any;
	}

	const tips: Tip[] = [
		{
			id: 1,
			titleKey: 'about.user_manual.tips.1.title',
			descriptionKey: 'about.user_manual.tips.1.description',
			icon: BookOpen01Icon,
			image: '/tips/cover.avif'
		},
		{
			id: 2,
			titleKey: 'about.user_manual.tips.2.title',
			descriptionKey: 'about.user_manual.tips.2.description',
			icon: Coins01Icon,
			image: '/tips/coin.avif'
		},
		{
			id: 3,
			titleKey: 'about.user_manual.tips.3.title',
			descriptionKey: 'about.user_manual.tips.3.description',
			icon: BarChartIcon,
			image: '/tips/liquidity-pools.avif'
		},
		{
			id: 4,
			titleKey: 'about.user_manual.tips.4.title',
			descriptionKey: 'about.user_manual.tips.4.description',
			icon: BarChartIcon,
			image: '/tips/amm.avif'
		},
		{
			id: 5,
			titleKey: 'about.user_manual.tips.5.title',
			descriptionKey: 'about.user_manual.tips.5.description',
			icon: TradeUpIcon,
			image: '/tips/buying.avif'
		},
		{
			id: 6,
			titleKey: 'about.user_manual.tips.6.title',
			descriptionKey: 'about.user_manual.tips.6.description',
			icon: TradeDownIcon,
			image: '/tips/selling.avif'
		},
		{
			id: 7,
			titleKey: 'about.user_manual.tips.7.title',
			descriptionKey: 'about.user_manual.tips.7.description',
			icon: Target01Icon,
			image: '/tips/rugpull.avif'
		},
		{
			id: 8,
			titleKey: 'about.user_manual.tips.8.title',
			descriptionKey: 'about.user_manual.tips.8.description',
			icon: BarChartIcon,
			image: '/tips/portfolio.avif'
		},
		{
			id: 9,
			titleKey: 'about.user_manual.tips.9.title',
			descriptionKey: 'about.user_manual.tips.9.description',
			icon: Award01Icon,
			image: '/tips/market.avif'
		},
		{
			id: 10,
			titleKey: 'about.user_manual.tips.10.title',
			descriptionKey: 'about.user_manual.tips.10.description',
			icon: Target01Icon,
			image: '/tips/hopium.avif'
		},
		{
			id: 11,
			titleKey: 'about.user_manual.tips.11.title',
			descriptionKey: 'about.user_manual.tips.11.description',
			icon: DiceFaces01Icon,
			image: '/tips/arcade.avif'
		},
		{
			id: 12,
			titleKey: 'about.user_manual.tips.12.title',
			descriptionKey: 'about.user_manual.tips.12.description',
			icon: BarChartIcon,
			image: '/tips/live.avif'
		},
		{
			id: 13,
			titleKey: 'about.user_manual.tips.13.title',
			descriptionKey: 'about.user_manual.tips.13.description',
			icon: BarChartIcon,
			image: '/tips/treemap.avif'
		},
		{
			id: 14,
			titleKey: 'about.user_manual.tips.14.title',
			descriptionKey: 'about.user_manual.tips.14.description',
			icon: Award01Icon,
			image: '/tips/leaderboard.avif'
		},
		{
			id: 15,
			titleKey: 'about.user_manual.tips.15.title',
			descriptionKey: 'about.user_manual.tips.15.description',
			icon: Coins01Icon,
			image: '/tips/daily.avif'
		},
		{
			id: 16,
			titleKey: 'about.user_manual.tips.16.title',
			descriptionKey: 'about.user_manual.tips.16.description',
			icon: TradeUpIcon,
			image: '/tips/ender.avif'
		}
	];

	let currentPage = $state(0);
	const currentTip = $derived(tips[currentPage]);

	function nextTip() {
		if (currentPage < tips.length - 1) {
			currentPage++;
		}
	}

	function previousTip() {
		if (currentPage > 0) {
			currentPage--;
		}
	}

	function goToPage(page: number) {
		currentPage = page;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="flex max-h-[90vh] w-full max-w-[calc(100%-2rem)] flex-col sm:max-w-2xl">
		<div class="min-h-0 flex-1 space-y-6 overflow-y-auto">
			<!-- Main content -->
			<div class="space-y-4">
				<div class="flex items-center gap-3">
					<div class="bg-muted rounded-lg p-3">
						<HugeiconsIcon icon={currentTip.icon} class="h-8 w-8" />
					</div>
					<h3 class="text-xl font-semibold">{$_(currentTip.titleKey)}</h3>
				</div>

				<p class="text-muted-foreground leading-relaxed">
					{$_(currentTip.descriptionKey)}
				</p>

				{#if currentTip.image}
					<div class="overflow-hidden rounded-lg border">
						<img src={currentTip.image} alt={$_(currentTip.titleKey)} class="h-auto w-full" />
					</div>
				{/if}
			</div>

			<!-- Page dots -->
			<div class="flex items-center justify-center gap-2">
				{#each tips as tip, index}
					<button
						aria-label={`Go to page ${index + 1}`}
						onclick={() => goToPage(index)}
						class="h-2 w-2 rounded-full transition-colors {index === currentPage
							? 'bg-primary'
							: 'bg-muted-foreground/30 hover:bg-muted-foreground/50'}"
						aria-current={index === currentPage ? 'page' : undefined}
					></button>
				{/each}
			</div>
		</div>

		<!-- Navigation -->
		<div class="flex items-center justify-between border-t pt-4">
			<Button
				variant="outline"
				onclick={previousTip}
				disabled={currentPage === 0}
				class="flex items-center gap-2"
			>
				<HugeiconsIcon icon={ArrowLeft01Icon} class="h-4 w-4" />
				{$_('about.user_manual.previous')}
			</Button>

			<div class="flex items-center gap-2">
				<span class="text-muted-foreground text-sm">
					{$_('about.user_manual.tip_of')
						.replace('{{current}}', (currentPage + 1).toString())
						.replace('{{total}}', tips.length.toString())}
				</span>
			</div>

			<Button
				variant="outline"
				onclick={nextTip}
				disabled={currentPage === tips.length - 1}
				class="flex items-center gap-2"
			>
				{$_('about.user_manual.next')}
				<HugeiconsIcon icon={ArrowRight01Icon} class="h-4 w-4" />
			</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>
