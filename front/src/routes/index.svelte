<script lang="ts">
	import { setContext } from 'svelte';
  import Calendar from '$components/Calendar.svelte';
  import FlightSearch from '$components/FlightSearch.svelte';
  import FlightsView from '$components/FlightsView.svelte';
  import TripView from '$components/FlightView/TripView.svelte';
	import { MaterialApp, Row, Col, Snackbar } from 'svelte-materialify';
  import type { FlightOffer } from '$types/flight';

	//One of the ways in Svelte to set a shared variable between the components. Backend URL.
	setContext('API_URL', 'http://localhost:3000');

	let calendar: any;
	let flightsView: any;
	let flightSearch: any;
	let tripView: any;
	let errorBar = false;
  let flightOffers: FlightOffer;

	/**
	 * Listener for the backend's response with search criteria data
	 * @param {object} data
	 * @property {object} data.offers           Offers object received from backend
	 * @property {string} data.originCity
	 * @property {string} data.destinationCity
	 * @property {boolean} data.datesChange     True if only dates changed for the request (calendar click)
	 */
	function offersReady(data: any) {
    flightOffers = data.offers;
		if (data.offers.length > 0) {
			if (!data.datesChange) calendar.showCalendarButton();
		}
	}

	/**
	 * Listener for search button click. Represent a new search all previous data is deleted.
	 */
	function searchClicked() {
		flightsView.resetFlights();
		calendar.resetCalendar();
		tripView.resetChosenOffer();
	}

	/**
	 * Listener for a click in calendar datepair. New search with only dates changing.
	 * Previous calendar prices are kept in memory.
	 */
	function datesChange() {
		flightsView.resetFlights();
	}

	function showTripView(trip: any) {
		tripView.setChosenOffer(trip);
		calendar.hideCalendarButton();
	}

	/**
	 * Error from the backend listener
	 */
	function showError() {
		errorBar = true;
	}

	function changeFlights() {
		flightsView.changeDepart();
		calendar.showCalendarButton();
		tripView.resetChosenOffer();
	}

	function outboundSelected() {
		calendar.hideCalendar();
		calendar.hideCalendarButton();
	}

	function changeDepart() {
		calendar.showCalendarButton();
	}
</script>

<main>
	<MaterialApp>
		<Row class="d-flex justify-center pl-8 pr-8 pl-md-0 pr-md-0">
			<Col cols={5} sm={3} md={2} xl={1}><img width="100%" src="amadeus_logo.png" alt="" /></Col>
			<Col cols={12} sm={12} md={8} xl={10} />
			<Col cols={0} sm={0} md={2} xl={1} />
		</Row>
		<Row class="d-flex justify-center pl-8 pr-8 pl-md-0 pr-md-0">
			<Col cols={12} sm={12} md={8}>
				<FlightSearch
					bind:this={flightSearch}
					on:searchButtonClicked={searchClicked}
					on:datesChange={datesChange}
					on:flightsReady={(event) => calendar.flightSearchListener(event.detail)}
					on:offersReady={(event) => offersReady(event.detail)}
					on:error={showError}
				/>
			</Col>
		</Row>
		<Row class="d-flex justify-center pl-8 pr-8 pl-md-0 pr-md-0">
			<Col sm={12} md={10} lg={8}>
				<Calendar
					bind:this={calendar}
					on:dateClicked={(event) =>
						flightSearch.newDateSearch(event.detail.depDate, event.detail.retDate)}
					on:error={showError}
				/>
			</Col>
		</Row>
		<Row class="d-flex justify-center pl-8 pr-8 pl-md-0 pr-md-0">
			<Col sm={12} md={10} lg={7}>
				<FlightsView
					bind:this={flightsView}
          bind:offers={flightOffers}
					on:offerChosen={(event) => showTripView(event.detail)}
					on:outboundSelected={outboundSelected}
					on:changeDepart={changeDepart}
				/>
			</Col>
		</Row>
		<Row class="d-flex justify-center pl-8 pr-8 pl-md-0 pr-md-0">
			<Col sm={12} md={10} lg={7}>
				<TripView bind:this={tripView} on:changeFlights={(event) => changeFlights()} />
			</Col>
		</Row>
		<Snackbar class="flex-column" bind:active={errorBar} top center timeout={5000}>
			An internal error occurred. Please try again.
		</Snackbar>
	</MaterialApp>
</main>

<style>
</style>
