<script lang="ts">
  import { CONSTANTS } from "$stores/const-store";
  import type { AutocompleteSuggestion, AutocompleteInput } from "$types/autocomplete";
  import { createEventDispatcher } from "svelte";

  $: constants = $CONSTANTS;
  const dispatcher = createEventDispatcher();

  let options: AutocompleteSuggestion[] = [];
  export let visible: boolean = false;
	//The timeouts are used to store the interval between keypresses by the user
	//The objective is to start a request to the autocomplete service when user stops typing
	let timeout: number;
	const timeoutInterval = 750;

  export function requestSuggestions(keyword: string) {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      if (!keyword) return;
		  const apiURL = `${constants.API_URL}/search-suggestions?keyword=${keyword}`;
		  const request = new Request(apiURL, { method: 'GET' });
		  fetch(request)
			  .then((response) => response.json())
			  .then((suggestions: AutocompleteSuggestion[]) => {options = suggestions; visible = true;})
			  .finally(() => {console.log(options)});
      }, timeoutInterval);
  }
</script>

{#if true}
  <ul class="autocomplete-list" id="origin-items-list">
    {#each options as sugg}
      <li on:click={() => dispatcher('select', sugg.iataCode)} style="display: flex;">
        <div class="autocomplete-iata">
          <span style="font-weight: bold; font-size: 16px;">{sugg.iataCode}</span>
        </div>
        <div class="autocomplete-airport-city">
          <span style="font-weight: 500; font-size: 14px;">{sugg.cityName}</span>
          <span>{sugg.name}</span>
        </div>
      </li>
    {/each}
  </ul>
{/if}

<style>
  :root {
		--autocomplete-hover: #d9dfe6;
		--amadeus-blue: rgb(0, 94, 184);
	}

	ul.autocomplete-list {
		position: relative;
		margin: 0;
		top: 0;
		width: 100%;
		padding: 0 3px 0 0;
		background-color: #fff;
		list-style: none;
		max-height: 200px;
		overflow-y: auto;
		display: none;
	}

	ul.autocomplete-list > li {
		padding: 10px;
		font-size: 13px;
		border-bottom: 1px solid #bcbcbc;
	}

	:global(ul.autocomplete-list > li > strong) {
		font-size: 16px;
	}

	ul.autocomplete-list > li:hover {
		cursor: pointer;
		background-color: var(--autocomplete-hover);
	}
</style>