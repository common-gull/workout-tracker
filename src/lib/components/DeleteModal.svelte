<script lang="ts">
	import Modal from './Modal.svelte';

	interface Props {
		title: string;
		message: string;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let { title, message, onConfirm, onCancel }: Props = $props();
</script>

<Modal
	{onCancel}
	size="sm"
	ariaLabelledby="delete-modal-title"
	ariaDescribedby="delete-modal-description"
>
	<!-- Icon -->
	<div class="mb-4 flex items-center justify-center pt-6">
		<div class="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
			<svg
				class="h-6 w-6 text-red-600 dark:text-red-400"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
				/>
			</svg>
		</div>
	</div>

	<div class="px-6 pb-6">
		<h2 id="delete-modal-title" class="mb-2 text-center text-xl font-bold dark:text-gray-100">
			{title}
		</h2>
		<p id="delete-modal-description" class="mb-6 text-center text-gray-600 dark:text-gray-300">
			{message}
		</p>

		<!-- Actions -->
		<div class="flex gap-3">
			<button
				onclick={onCancel}
				class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
			>
				Cancel
			</button>
			<button
				onclick={onConfirm}
				class="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
			>
				Delete
			</button>
		</div>
	</div>
</Modal>
