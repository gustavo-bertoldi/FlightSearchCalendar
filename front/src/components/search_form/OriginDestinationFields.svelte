<script lang="ts">
	import { Icon, ProgressCircular, TextField, Col } from 'svelte-materialify';
	import { CONSTANTS } from '$stores/const-store';
	import InputAutocomplete from './InputAutocomplete.svelte';
	import type { AutocompleteSuggestion } from '$types/autocomplete';

	$: constants = $CONSTANTS;
	export let origin: string;
	export let destination: string;
  export let cols: number;
  export let sm: number;
  export let lg: number;
	let originAutocomplete: InputAutocomplete;
	let destinationAutocomplete: InputAutocomplete;

	//Rules to check form validity
	//Origin can't be empty neither equal to destination
	const originRules = [
		(v: string) => {
			if (!v) {
				return 'Please enter the origin city or airport';
			} else if (origin === destination) {
				return 'Origin and destination must be different';
			}
			return true;
		}
	];

	//Destination can't be empty neither equal to origin
	const destinationRules = [
		(v: string) => {
			//searchActive = false;
			if (!v) {
				return 'Please enter the destination city or airport';
			} else if (origin === destination) {
				return 'Origin and destination must be different';
			}
			//searchActive = true;
			return true;
		}
	];
</script>

<Col cols={cols} sm={sm} lg={lg}>
	<TextField
		color={constants.AMADEUS_BLUE}
		bind:value={origin}
		rules={originRules}
		on:focus={() => originAutocomplete.$set({ visible: true })}
		on:blur={() => originAutocomplete.$set({ visible: false })}
		on:keydown={() => originAutocomplete.requestSuggestions(origin)}
	>
		<div slot="append" id="origin-autocomplete-load">
			<Icon>
				<ProgressCircular indeterminate color={constants.AMADEUS_BLUE} />
			</Icon>
		</div>
		Flight origin
	</TextField>
	<InputAutocomplete
		bind:this={originAutocomplete}
		on:select={(evt) => (origin = evt.detail)}
	/>
</Col>
<Col cols={cols} sm={sm} lg={lg}>
	<TextField
		color={constants.AMADEUS_BLUE}
		bind:value={destination}
		rules={destinationRules}
		on:focus={() => destinationAutocomplete.$set({ visible: true })}
		on:blur={() => destinationAutocomplete.$set({ visible: false })}
		on:keydown={() => destinationAutocomplete.requestSuggestions(destination)}
	>
		<div slot="append" id="destination-autocomplete-load">
			<Icon>
				<ProgressCircular indeterminate color={constants.AMADEUS_BLUE} />
			</Icon>
		</div>
		Flight destination
	</TextField>
	<InputAutocomplete
		bind:this={destinationAutocomplete}
		on:select={(evt) => (destination = evt.detail)}
	/>
</Col>
