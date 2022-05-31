<script>
  import { setContext } from "svelte";
  import Calendar from "./Calendar.svelte";
  import FlightSearch from "./FlightSearch.svelte";
  import FlightsView from "./FlightsView.svelte";
  import { MaterialApp, Row, Col } from 'svelte-materialify';


  setContext('API_URL', 'http://localhost:3000')

  let calendar;
  let flightsView;
  let flightSearch;

  function offersReady(data) {
    if (data.offers.length > 0) {
      flightsView.flightSearchListener(data);
      if (!data.datesChange) calendar.showCalendarButton();
    }
  }

  function searchClicked() {
    flightsView.resetFlights();
    calendar.resetCalendar();
  }

  function datesChange() {
    flightsView.resetFlights();
  }

</script>

<main>
  <MaterialApp>
    <Row class="d-flex justify-center pl-sm-3 pr-sm-3">
      <Col cols={5} sm={3} md={2} xl={1}><img width="100%" src="amadeus_logo.png" alt=""></Col>
      <Col cols={12} sm={12} md={8} xl={10}></Col>
      <Col cols={0} sm={0} md={2} xl={1}></Col>
    </Row>
    <Row class="d-flex justify-center pl-sm-3 pr-sm-3">
      <Col cols={12} sm={12} md={8}>
        <FlightSearch bind:this={flightSearch} on:searchButtonClicked={searchClicked} on:datesChange={datesChange} on:flightsReady={event => calendar.flightSearchListener(event.detail)} on:offersReady={event => offersReady(event.detail)}/>
      </Col>
    </Row>
    <Row class="d-flex justify-center pl-sm-3 pr-sm-3">
      <Col sm={12} md={10} lg={8}>
        <Calendar bind:this={calendar} on:dateClicked={event => flightSearch.newDateSearch(event.detail.depDate, event.detail.retDate)}/>
      </Col>
    </Row>
    <Row class="d-flex justify-center pl-sm-3 pr-sm-3">
      <Col sm={12} md={10} lg={7}>
        <FlightsView bind:this={flightsView}/>
      </Col>
    </Row>
  </MaterialApp>
</main>


<style>

</style>