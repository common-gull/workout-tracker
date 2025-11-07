<script lang="ts">
	interface Props {
		url: string;
	}

	let { url }: Props = $props();

	// Extract video ID from various YouTube URL formats
	function getYouTubeVideoId(url: string): string | null {
		const patterns = [
			/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/, // Standard and shortened URLs
			/youtube\.com\/embed\/([^&\s]+)/, // Embed URLs
			/youtube\.com\/v\/([^&\s]+)/ // Old embed format
		];

		for (const pattern of patterns) {
			const match = url.match(pattern);
			if (match) return match[1];
		}
		return null;
	}

	let videoId = $derived(getYouTubeVideoId(url));
	let embedUrl = $derived(videoId ? `https://www.youtube.com/embed/${videoId}` : null);
	let showPlayer = $state(false);
</script>

{#if embedUrl}
	{#if !showPlayer}
		<!-- Thumbnail Preview -->
		<button
			onclick={() => (showPlayer = true)}
			class="group relative w-full overflow-hidden rounded-lg bg-gray-100"
		>
			<!-- YouTube Thumbnail -->
			<img
				src="https://img.youtube.com/vi/{videoId}/hqdefault.jpg"
				alt="Video thumbnail"
				class="h-full w-full object-cover transition-opacity group-hover:opacity-75"
			/>
			<!-- Play Button Overlay -->
			<div
				class="absolute inset-0 flex items-center justify-center bg-black/20 transition-all group-hover:bg-black/30"
			>
				<div
					class="rounded-full bg-red-600 p-3 shadow-lg transition-transform group-hover:scale-110"
				>
					<svg class="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
						<path d="M8 5v14l11-7z" />
					</svg>
				</div>
			</div>
		</button>
	{:else}
		<!-- YouTube Embed -->
		<div class="relative w-full" style="padding-bottom: 56.25%;">
			<iframe
				src={embedUrl}
				title="Exercise video"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowfullscreen
				class="absolute inset-0 h-full w-full rounded-lg"
			></iframe>
		</div>
	{/if}
{:else}
	<!-- Fallback for non-YouTube links -->
	<a
		href={url}
		target="_blank"
		rel="noopener noreferrer"
		class="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
	>
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
			/>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		Watch Video
	</a>
{/if}
