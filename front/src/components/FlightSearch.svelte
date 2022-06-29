<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button, MaterialApp, Row, Col, ProgressCircular } from 'svelte-materialify';
	import { format } from 'date-fns';
  import DropDownMenu from '$components/SearchForm/DropDownMenu.svelte';  
  import AutocompleteField from '$components/SearchForm/AutocompleteField.svelte';
  import DateField from '$components/SearchForm/DateField.svelte';
  import NumberField from '$components/SearchForm/NumberField.svelte';
  import { CONSTANTS } from '$stores/constants';
  import { origin, destination, departureDate, returnDate, adults, flightClass, legs, offersResult } from '$stores/flight-info';
  import type { FlightOffer } from '$types/flight';
  import type { CalendarData, CalendarPrices } from '$types/calendar';
  import { calendarData } from '$stores/calendar-data';

	const dispatch = createEventDispatcher();
  
  $: constants = $CONSTANTS;

	$: originIATA = $origin.substring(0, 3);
	$: destinationIATA = $destination.substring(0, 3);
	$: originCity = $origin.substring(6);
	$: destinationCity = $destination.substring(6);
	let searchActive: boolean = true;
  let loading: boolean = false;

	//Rules to check form validity
	//Origin can't be empty neither equal to destination
	const originRules = [
		(v: string) => {
			searchActive = false;
			if (!v) {
				return 'Please enter the origin city or airport';
			} else if (originCity === destinationCity) {
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
			} else if (originCity === destinationCity) {
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

	/**
	 * Helper function to validate dates
	 * This function advances the selected date by one, two or three days depending on the distance of
	 * today's date. This needs to be done because calendar shows prices from up to three days before
	 * the selected dates, but these dates can't be in the past.
	 * Ex.: The user selects tomorrow date as departure date, dates from -1 and -2 days would be in the
	 * past. So we advance the selected date by two days to avoid past dates while keeping the selected
	 * date shown in the calendar.
	 * @param {Date} date Date to be verified
	 * @return {Date} Verified and valid date
	 */
  /*
	function dateVerification(date: Date): Date {
		const today = new Date();
		const tomorrow = addDays(today, 1);
		const dayAfterTomorrow = addDays(today, 2);

		if (isSameDay(date, today)) {
			date = addDays(date, 3);
		} else if (isSameDay(date, tomorrow)) {
			date = addDays(date, 2);
		} else if (isSameDay(date, dayAfterTomorrow)) {
			date = addDays(date, 1);
		}
		return date;
	}
  */
	/**
	 * Helper function to retrieve and prepare data entered in the search form to be sent in the request
	 * @param {boolean} forCalendar This parameter is used to perform additional verification on date fields
	 * and return additional parameter in the case of a calendar scroll
	 * @returns {object} Object containing all the needed data, after treatment, to be sent in the request
	 */
  /*
	function getFormData(forCalendar: boolean): FlightSearchForm {
		let departureDate = new Date();
		let returnDate = new Date(flightReturnDate);
		let formData: FlightSearchForm = {
			origin: flightOrigin,
			destination: flightDestination,
			adults: parseInt(nbAdults),
			class: flightClass.toUpperCase().replace(' ', '_'),
			departureDateFormatted: format(departureDate, 'yyyy-MM-dd'),
			returnDateFormatted: format(returnDate, 'yyyy-MM-dd')
		};

		if (forCalendar) {
			departureDate = dateVerification(departureDate);
			returnDate = dateVerification(returnDate);
			formData.selectedDepartureDate = flightDepartureDate;
			formData.selectedReturnDate = flightReturnDate;
		}

		return formData;
	}
  */
	/**
	 * Sends the request to the backend and dispatches an event when the response is received.
	 * The parameter datesChange indicates that the source of the new request is a click on a
	 * new datepair in the calendar. This dispatches a different event because the responses
	 * are treated differently.
	 * @param {boolean} datesChange Indicates if the source of the request is a click on a
	 * new datepair in the calendar
	 */
	function flightSearch(): void {
    loading = true;
		const requestURL =
			`${constants.API_URL}/get-flight-offers` +
			`?origin=${originIATA}` +
			`&destination=${destinationIATA}` +
			`&departureDate=${format(new Date($departureDate), 'yyyy-MM-dd')}` +
			`&returnDate=${format(new Date($returnDate), 'yyyy-MM-dd')}` +
			`&adults=${$adults}` +
			`&travelClass=${$flightClass.toUpperCase().replace(' ', '_')}`;
      
		const request = new Request(requestURL, { method: 'GET' });
		fetch(request)
			.then((response) => response.json())
			.then((offers: FlightOffer[]) => {
        offersResult.set(offers);
        flightSearchCalendar();
			})
			.catch((err) => {
				console.error(err);
				dispatch('error');
			}).finally(() => loading = false)
	}

	/**
	 * Sends a request to the backend to retrieve the prices for the calendar component
	 */
	function flightSearchCalendar(): void {
		const requestURL =
			`${constants.API_URL}/calendar-view` +
			`?origin=${originIATA}` +
			`&destination=${destinationIATA}` +
			`&departureDate=${format(new Date($departureDate), 'yyyy-MM-dd')}` +
			`&returnDate=${format(new Date($returnDate), 'yyyy-MM-dd')}` +
			`&adults=${$adults}` +
			`&travelClass=${$flightClass.toUpperCase().replace(' ', '_')}`;

		const request = new Request(requestURL, { method: 'GET' });
		fetch(request)
			.then((response) => response.json())
			.then((data: CalendarData[]) => {
        calendarData.set(data);
			})
			.catch((err) => {
				console.error(err);
				dispatch('error');
			});
	}

	/**
	 * Listener to event from the Calendar component when a new datepair is selected
	 * @param {string} depDate New departure date in the format 'yyyy-MM-dd'
	 * @param {string} retDate New return date in the format 'yyyy-MM-dd'
	 */
  /*
	export function newDateSearch(depDate: string, retDate: string): void {
		let departureDateInput = document.getElementById('fs-flight-departure-date');
		let returnDateInput = document.getElementById('fs-flight-return-date');
		if (
			departureDateInput instanceof HTMLInputElement &&
			returnDateInput instanceof HTMLInputElement
		) {
			departureDateInput.value = depDate;
			returnDateInput.value = retDate;
		}
		flightDepartureDate = depDate;
		flightReturnDate = retDate;
		flightSearch(true);
	}
  */

</script>

<MaterialApp>
	<Row class="d-flex justify-center">
		<Col cols={12} lg={11}>
      <DropDownMenu options={['Roundtrip', 'One-way']} bind:value={$legs}/>
			<DropDownMenu options={['Economy', 'Premium Economy', 'Business', 'First']} bind:value={$flightClass}/>
		</Col>
	</Row>
	<Row class="d-flex justify-center">
    <AutocompleteField cols={12} sm={12} lg={3} rules={originRules} bind:value={$origin}>Flight origin</AutocompleteField>
    <AutocompleteField cols={12} sm={12} lg={3} rules={destinationRules} bind:value={$destination}>Flight destination</AutocompleteField>
    <DateField cols={5} sm={5} lg={2} min={(new Date).toDateString()} rules={departureDateRules} bind:value={$departureDate}>Departure</DateField>
    <DateField cols={5} sm={5} lg={2} min={$departureDate} rules={returnDateRules} bind:value={$returnDate}>Return</DateField>
    <NumberField cols={2} sm={2} lg={1} rules={adultsRules} bind:value={$adults}>Adults</NumberField>
    {#if !loading}
		  <Col cols={12} sm={12} lg={12} class="d-flex justify-center">
			  <Button class="white-text search-btn" id="search-flights-btn" disabled={!searchActive} on:click={flightSearch}>Search</Button>
		  </Col>
    {/if}
	</Row>
  {#if loading}
  	<div class="d-flex justify-center">
		  <ProgressCircular indeterminate color={constants.AMADEUS_BLUE} />
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
