<script lang="ts">
	import { Button, Menu, Icon, List, ListItem } from 'svelte-materialify';
	import { mdiMenuDown } from '@mdi/js';

	export let value = 'Roundtrip';
	export let options: string[];

	const AMADEUS_BLUE = 'rgb(0,94,184)';

	let active: boolean;
</script>

<Menu bind:active>
	<div slot="activator">
		<Button class="upper-menu-button" text style={active ? `color: ${AMADEUS_BLUE}` : ''}>
			<Icon path={mdiMenuDown} rotate={active ? 180 : 0} />
			{value}
		</Button>
	</div>
	<List>
		{#each options as option}
			<ListItem on:click={() => (value = option)}>{option}</ListItem>
		{/each}
	</List>
</Menu>
