<script lang="ts">
	import { onMount } from 'svelte';
	import { getAllExercises, deleteExercise, searchExercises } from '$lib/db';
	import type { Exercise } from '$lib/types';
	import ExerciseForm from '$lib/components/ExerciseForm.svelte';
	import DeleteModal from '$lib/components/DeleteModal.svelte';

	let exercises: Exercise[] = [];
	let filteredExercises: Exercise[] = [];
	let searchQuery = '';
	let showForm = false;
	let editingExercise: Exercise | null = null;
	let deleteTarget: Exercise | null = null;
	let loading = true;

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
</script>

<div class="container mx-auto max-w-6xl px-4 py-4 sm:py-8">
	<div class="mb-4 flex items-center justify-between gap-2 sm:mb-6">
		<h1 class="text-2xl font-bold sm:text-3xl">Exercise Library</h1>
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
			class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none sm:px-4 sm:text-base"
		/>
	</div>

	<!-- Loading State -->
	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="text-gray-500">Loading exercises...</div>
		</div>
	{/if}

	<!-- Empty State -->
	{#if !loading && filteredExercises.length === 0 && !searchQuery}
		<div class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
			<p class="mb-4 text-gray-600">No exercises yet. Add your first exercise to get started!</p>
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
			<p class="text-gray-600">No exercises found matching "{searchQuery}"</p>
		</div>
	{/if}

	<!-- Exercise List -->
	{#if !loading && filteredExercises.length > 0}
		<div class="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each filteredExercises as exercise (exercise.id)}
				<div
					class="rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md sm:p-4"
				>
					<div class="mb-2 flex items-start justify-between gap-2">
						<h3 class="min-w-0 flex-1 truncate text-base font-semibold sm:text-lg">
							{exercise.name}
						</h3>
						<div class="flex flex-shrink-0 gap-2">
							<button
								onclick={() => handleEdit(exercise)}
								class="text-blue-600 hover:text-blue-800"
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
								class="text-red-600 hover:text-red-800"
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
					<p class="mb-2 text-xs break-words text-gray-600 sm:text-sm">{exercise.description}</p>
					{#if exercise.videoLink}
						<a
							href={exercise.videoLink}
							target="_blank"
							rel="noopener noreferrer"
							data-sveltekit-reload
							class="text-sm text-blue-600 hover:underline"
						>
							View Video
						</a>
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
