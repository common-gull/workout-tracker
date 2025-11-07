<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';

	let { children } = $props();
	let mobileMenuOpen = $state(false);

	// Close mobile menu when route changes
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		$page.url.pathname;
		mobileMenuOpen = false;
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex min-h-screen flex-col">
	<!-- Navigation -->
	<nav class="border-b border-gray-200 bg-white shadow-sm">
		<div class="container mx-auto max-w-7xl px-4">
			<div class="flex h-16 items-center justify-between">
				<a href="/" data-sveltekit-preload-data class="text-lg font-bold text-gray-900 sm:text-xl">
					Workout Tracker
				</a>

				<!-- Desktop Navigation -->
				<div class="hidden gap-6 md:flex">
					<a
						href="/"
						data-sveltekit-preload-data
						class="text-gray-600 hover:text-gray-900"
						class:font-semibold={$page.url.pathname === '/'}
						class:text-blue-600={$page.url.pathname === '/'}
					>
						Today
					</a>
					<a
						href="/exercises"
						data-sveltekit-preload-data
						class="text-gray-600 hover:text-gray-900"
						class:font-semibold={$page.url.pathname === '/exercises'}
						class:text-blue-600={$page.url.pathname === '/exercises'}
					>
						Exercises
					</a>
					<a
						href="/calendar"
						data-sveltekit-preload-data
						class="text-gray-600 hover:text-gray-900"
						class:font-semibold={$page.url.pathname === '/calendar'}
						class:text-blue-600={$page.url.pathname === '/calendar'}
					>
						Calendar
					</a>
				</div>

				<!-- Mobile Menu Button -->
				<button
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					class="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
					aria-label="Toggle menu"
				>
					{#if mobileMenuOpen}
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					{:else}
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 6h16M4 12h16M4 18h16"
							/>
						</svg>
					{/if}
				</button>
			</div>

			<!-- Mobile Menu -->
			{#if mobileMenuOpen}
				<div class="border-t border-gray-200 py-4 md:hidden">
					<div class="flex flex-col space-y-4">
						<a
							href="/"
							data-sveltekit-preload-data
							class="text-gray-600 hover:text-gray-900"
							class:font-semibold={$page.url.pathname === '/'}
							class:text-blue-600={$page.url.pathname === '/'}
						>
							Today
						</a>
						<a
							href="/exercises"
							data-sveltekit-preload-data
							class="text-gray-600 hover:text-gray-900"
							class:font-semibold={$page.url.pathname === '/exercises'}
							class:text-blue-600={$page.url.pathname === '/exercises'}
						>
							Exercises
						</a>
						<a
							href="/calendar"
							data-sveltekit-preload-data
							class="text-gray-600 hover:text-gray-900"
							class:font-semibold={$page.url.pathname === '/calendar'}
							class:text-blue-600={$page.url.pathname === '/calendar'}
						>
							Calendar
						</a>
					</div>
				</div>
			{/if}
		</div>
	</nav>

	<!-- Main Content -->
	<main class="flex-1 bg-gray-50">
		{@render children()}
	</main>
</div>
