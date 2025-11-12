<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		onCancel: () => void;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		ariaLabelledby?: string;
		ariaDescribedby?: string;
		children: Snippet;
	}

	let { onCancel, size = 'md', ariaLabelledby, ariaDescribedby, children }: Props = $props();

	const sizeClasses = {
		sm: 'max-w-md',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl'
	};

	const containerClasses = 'p-0 sm:p-4';
	const contentClasses = `h-full w-full shadow-xl sm:h-auto sm:max-h-[90vh] sm:rounded-lg ${sizeClasses[size]}`;

	let modalRef: HTMLDivElement;
	let previousActiveElement: HTMLElement | null = null;

	onMount(() => {
		// Save currently focused element
		previousActiveElement = document.activeElement as HTMLElement;

		// Prevent body scroll when modal is open
		document.body.style.overflow = 'hidden';

		// Focus the modal container
		modalRef?.focus();

		// Setup focus trap
		const focusableElements = modalRef.querySelectorAll<HTMLElement>(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		const firstFocusable = focusableElements[0];
		const lastFocusable = focusableElements[focusableElements.length - 1];

		// Focus first focusable element if available
		if (firstFocusable) {
			firstFocusable.focus();
		}

		// Handle tab key for focus trap
		const handleTab = (e: KeyboardEvent) => {
			if (e.key !== 'Tab') return;

			if (e.shiftKey) {
				// Shift + Tab
				if (document.activeElement === firstFocusable) {
					e.preventDefault();
					lastFocusable?.focus();
				}
			} else {
				// Tab
				if (document.activeElement === lastFocusable) {
					e.preventDefault();
					firstFocusable?.focus();
				}
			}
		};

		document.addEventListener('keydown', handleTab);

		return () => {
			// Restore body scroll when modal is closed
			document.body.style.overflow = '';

			// Restore focus to previously focused element
			previousActiveElement?.focus();

			// Remove event listener
			document.removeEventListener('keydown', handleTab);
		};
	});

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onCancel();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onCancel();
		}
	}
</script>

<div
	bind:this={modalRef}
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm {containerClasses}"
	onclick={handleBackdropClick}
	onkeydown={handleKeydown}
	role="dialog"
	aria-modal="true"
	aria-labelledby={ariaLabelledby}
	aria-describedby={ariaDescribedby}
	tabindex="-1"
>
	<div class="bg-white dark:bg-gray-800 {contentClasses}" role="document">
		{@render children()}
	</div>
</div>
