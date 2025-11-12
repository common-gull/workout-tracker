<script lang="ts">
	import type { Exercise } from '$lib/types';
	import VideoPlayer from './VideoPlayer.svelte';
	import Modal from './Modal.svelte';

	interface Props {
		exercise: Exercise;
		onClose: () => void;
	}

	let { exercise, onClose }: Props = $props();
</script>

<Modal
	onCancel={onClose}
	size="lg"
	ariaLabelledby="exercise-detail-title"
	ariaDescribedby="exercise-detail-description"
>
	<div class="flex h-full flex-col sm:max-h-[90vh]">
		<!-- Modal Header (Fixed) -->
		<div
			class="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4 dark:border-gray-700"
		>
			<h2
				id="exercise-detail-title"
				class="text-xl font-bold text-gray-900 sm:text-2xl dark:text-gray-100"
			>
				{exercise.name}
			</h2>
			<button
				onclick={onClose}
				class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
				aria-label="Close"
			>
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>

		<!-- Modal Body (Scrollable) -->
		<div class="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
			<!-- Description -->
			<div class="mb-6">
				<h3
					class="mb-2 text-sm font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400"
				>
					Description
				</h3>
				<p
					id="exercise-detail-description"
					class="text-base break-words whitespace-pre-wrap text-gray-700 dark:text-gray-300"
				>
					{exercise.description}
				</p>
			</div>

			<!-- Video -->
			{#if exercise.videoLink}
				<div>
					<h3
						class="mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400"
					>
						Video Tutorial
					</h3>
					<VideoPlayer url={exercise.videoLink} />
				</div>
			{/if}
		</div>

		<!-- Modal Footer (Fixed) -->
		<div
			class="flex-shrink-0 border-t border-gray-200 px-4 py-3 sm:px-6 sm:py-4 dark:border-gray-700"
		>
			<button
				onclick={onClose}
				class="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 sm:w-auto"
			>
				Close
			</button>
		</div>
	</div>
</Modal>
