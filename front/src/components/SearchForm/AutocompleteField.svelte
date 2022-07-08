<script lang="ts">
	import { Icon, ProgressCircular, TextField, Col } from 'svelte-materialify';
	import { CONSTANTS } from '$stores/constants';
	import type { AutocompleteSuggestion, InputRule } from '$types/autocomplete';

	export let cols: number | undefined = undefined;
	export let sm: number | undefined = undefined;
	export let md: number | undefined = undefined;
	export let lg: number | undefined = undefined;
	export let xl: number | undefined = undefined;
	export let value: string | undefined = undefined;
	export let rules: InputRule[] = [];
	export let autocompleteOptions: AutocompleteSuggestion[] = [];

	$: constants = $CONSTANTS;
	let loading = false;
	let showAutocomplete = false;
	let timeout: number;
	const timeoutInterval = 750;

	/**
	 * Listener for keydown event. Sends the autocomplete request
	 * @param {string} keyword Value of input field
	 * @param {string} input Input field, can take values 'origin' and 'destination'
	 */
	function fetchAutocomplete(keyword: string): void {
		if (!keyword) return;
		loading = true;
		const apiURL = `${constants.API_URL}/search-suggestions?keyword=${keyword}`;
		const request = new Request(apiURL, { method: 'GET' });
		fetch(request)
			.then((response) => response.json())
			.then((options: AutocompleteSuggestion[]) => (autocompleteOptions = options))
			.finally(() => (loading = false));
	}

	function keydown(this: HTMLInputElement) {
		clearTimeout(timeout);
		timeout = window.setTimeout(() => fetchAutocomplete(this.value), timeoutInterval);
	}
</script>

<Col {cols} {sm} {md} {lg} {xl}>
	<TextField
		color={constants.AMADEUS_BLUE}
		{rules}
		bind:value
		on:focus={() => (showAutocomplete = true)}
		on:blur={() => setTimeout(() => (showAutocomplete = false), 250)}
		on:keydown={keydown}
	>
		<div slot="append">
			{#if loading}
				<Icon>
					<ProgressCircular indeterminate color={constants.AMADEUS_BLUE} />
				</Icon>
			{/if}
		</div>
		<slot />
	</TextField>
	{#if showAutocomplete}
		<ul class="autocomplete-list">
			{#each autocompleteOptions as option}
				<li
					on:click={() => (value = `${option.iataCode} - ${option.cityName}`)}
					style="display: flex;"
				>
					<div class="autocomplete-iata">
						<span style="font-weight: bold; font-size: 16px;">{option.iataCode}</span>
					</div>
					<div class="autocomplete-airport-city">
						<span style="font-weight: 500; font-size: 14px;">{option.cityName}</span>
						<span>{option.name}</span>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</Col>

<style>
	:root {
		--autocomplete-hover: #d9dfe6;
		--amadeus-blue: rgb(0, 94, 184);
	}

	ul.autocomplete-list {
		margin: 0;
		top: 0;
		width: 100%;
		padding: 0 3px 0 0;
		background-color: #fff;
		list-style: none;
		max-height: 200px;
		overflow-y: auto;
	}

	ul.autocomplete-list > li {
		padding: 10px;
		font-size: 13px;
		border-bottom: 1px solid #bcbcbc;
	}

	ul.autocomplete-list > li:hover {
		cursor: pointer;
		background-color: var(--autocomplete-hover);
	}

	div.autocomplete-iata {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-right: 8px;
		background-color: rgb(184, 213, 233);
		border-radius: 6px;
		width: 60px;
	}

	div.autocomplete-airport-city {
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
</style>
