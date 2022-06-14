<script>
  import { setContext } from "svelte";
  import Calendar from "./Calendar.svelte";
  import FlightSearch from "./FlightSearch.svelte";
  import FlightsView from "./FlightsView.svelte";
  import { MaterialApp, Row, Col, Snackbar } from 'svelte-materialify';

  //One of the ways in Svelte to set a shared variable between the components. Backend URL.
  setContext('API_URL', 'http://ec2-54-246-222-69.eu-west-1.compute.amazonaws.com:3000')
  

  let calendar;
  let flightsView;
  let flightSearch;
  let errorBar = false;

  /**
   * Listener for the backend's response with search criteria data
   * @param {object} data
   * @property {object} data.offers           Offers object received from backend
   * @property {string} data.originCity 
   * @property {string} data.destinationCity 
   * @property {boolean} data.datesChange     True if only dates changed for the request (calendar click)
   */
  function offersReady(data) {
    if (data.offers.length > 0) {
      flightsView.flightSearchListener(data);
      if (!data.datesChange) calendar.showCalendarButton();
    }
  }

  /**
   * Listener for search button click. Represent a new search all previous data is deleted.
   */
  function searchClicked() {
    flightsView.resetFlights();
    calendar.resetCalendar();
  }

  /**
   * Listener for a click in calendar datepair. New search with only dates changing.
   * Previous calendar prices are kept in memory.
   */
  function datesChange() {
    flightsView.resetFlights();
  }

  /**
   * Error from the backend listener
   */
  function showError() {
    errorBar = true;
  }

</script>

<main>
  <MaterialApp>
    <h1>test deploy</h1>
    <Row class="d-flex justify-center pl-8 pr-8 pl-md-0 pr-md-0">
      <Col cols={5} sm={3} md={2} xl={1}><img width="100%" src="amadeus_logo.png" alt=""></Col>
      <Col cols={12} sm={12} md={8} xl={10}></Col>
      <Col cols={0} sm={0} md={2} xl={1}></Col>
    </Row>
    <Row class="d-flex justify-center pl-8 pr-8 pl-md-0 pr-md-0">
      <Col cols={12} sm={12} md={8}>
        <FlightSearch 
          bind:this={flightSearch} 
          on:searchButtonClicked={searchClicked}
          on:datesChange={datesChange}
          on:flightsReady={event => calendar.flightSearchListener(event.detail)}
          on:offersReady={event => offersReady(event.detail)}
          on:error={showError}
        />
      </Col>
    </Row>
    <Row class="d-flex justify-center pl-8 pr-8 pl-md-0 pr-md-0">
      <Col sm={12} md={10} lg={8}>
        <Calendar 
          bind:this={calendar} 
          on:dateClicked={event => flightSearch.newDateSearch(event.detail.depDate, event.detail.retDate)} 
          on:error={showError}
        />
      </Col>
    </Row>
    <Row class="d-flex justify-center pl-8 pr-8 pl-md-0 pr-md-0">
      <Col sm={12} md={10} lg={7}>
        <FlightsView bind:this={flightsView}/>
      </Col>
    </Row>
    <Snackbar class="flex-column" bind:active={errorBar} top center timeout={5000}>
      An internal error occurred. Please try again.
    </Snackbar>
  </MaterialApp>
</main>
<style>

</style>