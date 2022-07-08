<script lang="ts">
	import type { InputRule } from '$types/autocomplete';
	import { CONSTANTS } from '$stores/constants';
	import { Col, TextField } from 'svelte-materialify';

	export let cols: number | undefined = undefined;
	export let sm: number | undefined = undefined;
	export let md: number | undefined = undefined;
	export let lg: number | undefined = undefined;
	export let xl: number | undefined = undefined;
	export let value: number | undefined = undefined;
	export let rules: InputRule[] = [];

	$: _value = value?.toString();

	$: constants = $CONSTANTS;
</script>

<Col {cols} {sm} {md} {lg} {xl}>
	<TextField
		id="fs-adults"
		class="fs-text-field"
		type="number"
		color={constants.AMADEUS_BLUE}
		{rules}
		min={1}
		bind:value={_value}
	>
		<slot />
	</TextField>
</Col>
