<script lang="ts">
	export let topLeftCorner = false;
	export let topRightCorner = false;
	export let bottomRightCorner = false;

	$: _class =
		`${topLeftCorner ? 'top-left-corner' : ''} ` +
		`${topRightCorner ? 'top-right-corner' : ''} ` +
		`${bottomRightCorner ? 'bottom-right-corner' : ''}`;

	let date: string;
</script>

<div class={_class}>
	<span contenteditable="false" bind:textContent={date}><slot /></span>
</div>

<style>
	:root {
		--date-cell-background: rgb(0, 94, 184);
	}

	div {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 50px;
		background-color: var(--date-cell-background);
	}

	span {
		font-weight: 500;
		padding: 5px;
		color: white;
	}

	div.top-left-corner {
		border-top-left-radius: 10px;
	}

	div.top-right-corner {
		border-top-right-radius: 10px;
	}

	div.bottom-right-corner {
		border-bottom-right-radius: 10px;
	}
</style>
