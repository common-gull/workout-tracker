<script lang="ts">
	import { onMount } from 'svelte';
	import { getAllExercises, deleteExercise, searchExercises } from '$lib/db';
	import type { Exercise } from '$lib/types';
	import ExerciseForm from '$lib/components/ExerciseForm.svelte';
	import DeleteModal from '$lib/components/DeleteModal.svelte';
	import VideoPlayer from '$lib/components/VideoPlayer.svelte';
	import ExerciseDetailModal from '$lib/components/ExerciseDetailModal.svelte';

	let exercises = $state<Exercise[]>([]);
	let filteredExercises = $state<Exercise[]>([]);
	let searchQuery = $state('');
	let showForm = $state(false);
	let editingExercise = $state<Exercise | null>(null);
	let deleteTarget = $state<Exercise | null>(null);
	let loading = $state(true);
	let expandedCards = $state<Set<number>>(new Set());
	let selectedExercise = $state<Exercise | null>(null);

	onMount(async () => {
		await loadExercises();
	});

	async function loadExercises() {
		loading = true;
		exercises = await getAllExercises();
		filteredExercises = exercises;
		loading = false;
	}

	async function handleSearch() {
		if (searchQuery.trim()) {
			filteredExercises = await searchExercises(searchQuery);
		} else {
			filteredExercises = exercises;
		}
	}

	function handleAdd() {
		editingExercise = null;
		showForm = true;
	}

	function handleEdit(exercise: Exercise) {
		editingExercise = exercise;
		showForm = true;
	}

	function handleDelete(exercise: Exercise) {
		deleteTarget = exercise;
	}

	async function confirmDelete() {
		if (deleteTarget?.id) {
			await deleteExercise(deleteTarget.id);
			await loadExercises();
			deleteTarget = null;
		}
	}

	async function handleSaved() {
		showForm = false;
		editingExercise = null;
		await loadExercises();
	}

	function handleCancel() {
		showForm = false;
		editingExercise = null;
	}

	function toggleCard(exerciseId: number) {
		const newExpanded = new Set(expandedCards);
		if (newExpanded.has(exerciseId)) {
			newExpanded.delete(exerciseId);
		} else {
			newExpanded.add(exerciseId);
		}
		expandedCards = newExpanded;
	}

	function isCardExpanded(exerciseId: number): boolean {
		return expandedCards.has(exerciseId);
	}

	function viewDetails(exercise: Exercise) {
		selectedExercise = exercise;
	}

	function closeDetails() {
		selectedExercise = null;
	}

	// Helper to truncate text
	function truncateText(text: string, maxLength: number): string {
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength).trim() + '...';
	}
</script>

<div class="container mx-auto max-w-6xl px-4 py-4 sm:py-8">
	<div class="mb-4 flex items-center justify-between gap-2 sm:mb-6">
		<h1 class="text-2xl font-bold sm:text-3xl dark:text-gray-100">Exercise Library</h1>
		<button
			onclick={handleAdd}
			class="flex-shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 sm:px-4 sm:text-base"
		>
			<span class="hidden sm:inline">Add Exercise</span>
			<span class="sm:hidden">Add</span>
		</button>
	</div>

	<!-- Search -->
	<div class="mb-4 sm:mb-6">
		<input
			type="text"
			bind:value={searchQuery}
			oninput={handleSearch}
			placeholder="Search exercises..."
			class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none sm:px-4 sm:text-base dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
		/>
	</div>

	<!-- Loading State -->
	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="text-gray-500 dark:text-gray-400">Loading exercises...</div>
		</div>
	{/if}

	<!-- Empty State -->
	{#if !loading && filteredExercises.length === 0 && !searchQuery}
		<div
			class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700"
		>
			<p class="mb-4 text-gray-600 dark:text-gray-300">
				No exercises yet. Add your first exercise to get started!
			</p>
			<button
				onclick={handleAdd}
				class="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
			>
				Add First Exercise
			</button>
		</div>
	{/if}

	<!-- No Search Results -->
	{#if !loading && filteredExercises.length === 0 && searchQuery}
		<div class="py-12 text-center">
			<p class="text-gray-600 dark:text-gray-300">No exercises found matching "{searchQuery}"</p>
		</div>
	{/if}

	<!-- Exercise List -->
	{#if !loading && filteredExercises.length > 0}
		<div class="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each filteredExercises as exercise (exercise.id)}
				{@const isExpanded = isCardExpanded(exercise.id!)}
				{@const maxDescriptionLength = 120}
				<div
					class="rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4 dark:border-gray-700 dark:bg-gray-800"
				>
					<div class="mb-2 flex items-start justify-between gap-2">
						<button
							onclick={() => toggleCard(exercise.id!)}
							class="min-w-0 flex-1 text-left"
						>
							<h3
								class="flex items-center gap-2 text-base font-semibold sm:text-lg dark:text-gray-100"
							>
								<svg
									class="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform"
									class:rotate-90={isExpanded}
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5l7 7-7 7"
									/>
								</svg>
								<span class="truncate">{exercise.name}</span>
							</h3>
						</button>
						<div class="flex flex-shrink-0 gap-2">
							<button
								onclick={() => viewDetails(exercise)}
								class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
								aria-label="View details"
								title="View full details"
							>
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</button>
							<button
								onclick={() => handleEdit(exercise)}
								class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
								aria-label="Edit exercise"
							>
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
									/>
								</svg>
							</button>
							<button
								onclick={() => handleDelete(exercise)}
								class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
								aria-label="Delete exercise"
							>
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
							</button>
						</div>
					</div>

					<!-- Collapsed view: truncated description -->
					{#if !isExpanded}
						<p class="mb-2 text-xs text-gray-600 sm:text-sm dark:text-gray-400">
							{truncateText(exercise.description, maxDescriptionLength)}
						</p>
						{#if exercise.description.length > maxDescriptionLength || exercise.videoLink}
							<button
								onclick={() => toggleCard(exercise.id!)}
								class="text-xs text-blue-600 hover:underline dark:text-blue-400"
							>
								Show more
							</button>
						{/if}
					{/if}

					<!-- Expanded view: full description and video -->
					{#if isExpanded}
						<p
							class="mb-3 whitespace-pre-wrap break-words text-xs text-gray-600 sm:text-sm dark:text-gray-300"
						>
							{exercise.description}
						</p>
						{#if exercise.videoLink}
							<div class="mb-2">
								<VideoPlayer url={exercise.videoLink} />
							</div>
						{/if}
						<button
							onclick={() => toggleCard(exercise.id!)}
							class="text-xs text-blue-600 hover:underline dark:text-blue-400"
						>
							Show less
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Exercise Form Modal -->
{#if showForm}
	<ExerciseForm exercise={editingExercise} onSaved={handleSaved} onCancel={handleCancel} />
{/if}

<!-- Delete Confirmation Modal -->
{#if deleteTarget}
	<DeleteModal
		title="Delete Exercise"
		message="Are you sure you want to delete '{deleteTarget.name}'? This action cannot be undone."
		onConfirm={confirmDelete}
		onCancel={() => (deleteTarget = null)}
	/>
{/if}

<!-- Exercise Detail Modal -->
{#if selectedExercise}
	<ExerciseDetailModal exercise={selectedExercise} onClose={closeDetails} />
{/if}
