<script lang="ts">
	import { createEventDispatcher, tick } from 'svelte';
	import { Button, MaterialApp, Row, Col, ProgressCircular } from 'svelte-materialify';
	import DropDownMenu from '$components/SearchForm/DropDownMenu.svelte';
	import AutocompleteField from '$components/SearchForm/AutocompleteField.svelte';
	import DateField from '$components/SearchForm/DateField.svelte';
	import NumberField from '$components/SearchForm/NumberField.svelte';
	import { CONSTANTS } from '$stores/constants';
	import {
		origin,
		destination,
		departureDate,
		departureDateFormatted,
		returnDate,
		returnDateFormatted,
		adults,
		flightClass,
		legs,
		offersResult,
		originCity,
		destinationCity,
		flightSearch
	} from '$stores/flight_search';
	import { selectedPriceCell, fetchCalendar, calendar } from '$stores/calendar';
	import { format } from 'date-fns';

	const dispatcher = createEventDispatcher();

	let _departureDate = $departureDateFormatted;
	let _returnDate = $returnDateFormatted;
	let searchActive = true;
	let loading = false;
	selectedPriceCell.subscribe(async (v) => {
		await tick();
		if (v) {
			_departureDate = v.departureDate;
			_returnDate = v.returnDate;
			newSearch(false);
		}
	});

	//Rules to check form validity
	//Origin can't be empty neither equal to destination
	const originRules = [
		(v: string) => {
			searchActive = false;
			if (!v) {
				return 'Please enter the origin city or airport';
			} else if ($originCity === $destinationCity) {
				return 'Origin and destination must be different';
			}
			searchActive = true;
			return true;
		}
	];
	//Destination can't be empty neither equal to origin
	const destinationRules = [
		(v: string) => {
			searchActive = false;
			if (!v) {
				return 'Please enter the destination city or airport';
			} else if ($originCity === $destinationCity) {
				return 'Origin and destination must be different';
			}
			searchActive = true;
			return true;
		}
	];
	//Departure date can't be empty
	const departureDateRules = [(v: string) => !!v || 'Please enter the date of departure'];
	//Return date can't be empty
	const returnDateRules = [(v: string) => !!v || 'Please enter the date of return'];
	//Adults can't be empty
	const adultsRules = [(v: string) => !!v || 'Please enter number of adults'];

	function newSearch(newCalendar: boolean) {
		loading = true;
		$departureDate = new Date(_departureDate);
		$returnDate = new Date(_returnDate);
		$offersResult = undefined;
		$selectedPriceCell = undefined;
    $calendar = {};
		$flightSearch()
			.then((res) => {
				$offersResult = res;
			})
			.catch(() => dispatcher('error'))
			.finally(() => (loading = false));

    if (newCalendar) {
      $calendar = {};
			$fetchCalendar()
				.then((cal) => ($calendar = cal))
				.catch(() => dispatcher('error'));
		}
	}
</script>

<MaterialApp>
	<Row class="d-flex justify-center">
		<Col cols={12} lg={11}>
			<DropDownMenu options={['Roundtrip', 'One-way']} bind:value={$legs} />
			<DropDownMenu
				options={['Economy', 'Premium Economy', 'Business', 'First']}
				bind:value={$flightClass}
			/>
		</Col>
	</Row>
	<Row class="d-flex justify-center">
		<AutocompleteField cols={12} sm={12} lg={3} rules={originRules} bind:value={$origin}
			>Flight origin</AutocompleteField
		>
		<AutocompleteField cols={12} sm={12} lg={3} rules={destinationRules} bind:value={$destination}
			>Flight destination</AutocompleteField
		>
		<DateField
			cols={5}
			sm={5}
			lg={2}
			rules={departureDateRules}
			min={format(new Date(), 'yyyy-MM-dd')}
			bind:max={_returnDate}
			bind:value={_departureDate}>Departure</DateField
		>
		<DateField
			cols={5}
			sm={5}
			lg={2}
			rules={returnDateRules}
			bind:min={_departureDate}
			bind:value={_returnDate}>Return</DateField
		>
		<NumberField cols={2} sm={2} lg={1} rules={adultsRules} bind:value={$adults}>Adults</NumberField
		>
		{#if !loading}
			<Col cols={12} sm={12} lg={12} class="d-flex justify-center">
				<Button
					class="white-text search-btn"
					id="search-flights-btn"
					disabled={!searchActive}
					on:click={() => newSearch(true)}>Search</Button
				>
			</Col>
		{/if}
	</Row>
	{#if loading}
		<div class="d-flex justify-center">
			<ProgressCircular indeterminate color={$CONSTANTS.AMADEUS_BLUE} />
		</div>
	{/if}
</MaterialApp>

<style>
	:root {
		--autocomplete-hover: #d9dfe6;
		--amadeus-blue: rgb(0, 94, 184);
	}

	:global(button.search-btn),
	:global(#calendar-view-btn) {
		background-color: var(--amadeus-blue);
	}

	::-webkit-scrollbar {
		width: 6px;
	}

	::-webkit-scrollbar-thumb {
		background: #bcbcbc;
		-webkit-border-radius: 1ex;
		border-radius: 1ex;
	}

	:global(button.upper-menu-button) {
		color: #7b7b7b;
		padding: 0px 5px !important;
		min-width: 150px !important;
		margin-left: -10px;
	}

	:global(button.upper-menu-button > span) {
		justify-content: flex-start !important;
	}

	:global(button.upper-menu-button:hover) {
		color: var(--amadeus-blue);
	}
</style>
