<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex min-h-screen flex-col">
	<!-- Navigation -->
	<nav class="border-b border-gray-200 bg-white shadow-sm">
		<div class="container mx-auto max-w-7xl px-4">
			<div class="flex h-16 items-center justify-between">
				<a href="/" data-sveltekit-preload-data class="text-xl font-bold text-gray-900"
					>Workout Tracker</a
				>
				<div class="flex gap-6">
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
		</div>
	</nav>

	<!-- Main Content -->
	<main class="flex-1 bg-gray-50">
		{@render children()}
	</main>
</div>
