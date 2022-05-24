<script>
  import { setContext } from "svelte";
  import Calendar from "./Calendar.svelte";
  import FlightSearch from "./FlightSearch.svelte";
  import { MaterialApp, Row, Col } from 'svelte-materialify';


  setContext('API_URL', 'http://localhost:3000')

  let calendar;
</script>

<main>
  <MaterialApp>
    <Row class="d-flex justify-center pl-sm-3 pr-sm-3">
      <Col cols={5} sm={3} md={2} xl={1}><img width="100%" src="amadeus_logo.png" alt=""></Col>
      <Col cols={12} sm={12} md={8} xl={10}><h1 class="">Calendar flight search</h1></Col>
      <Col cols={0} sm={0} md={2} xl={1}></Col>
    </Row>
    <Row class="d-flex justify-center pl-sm-3 pr-sm-3">
      <Col cols={12} sm={12} md={8}>
        <FlightSearch on:flightsReady={event => calendar.flightSearchListener(event.detail)}/>
      </Col>
    </Row>
    <Row class="d-flex justify-center pl-sm-3 pr-sm-3">
      <Col sm={12} md={10} lg={8}>
        <Calendar bind:this={calendar}/>
      </Col>
    </Row>
  </MaterialApp>
</main>


<style>
  h1 {
    text-align: center;  
    margin-bottom: 30px;
    font-size: 50px;
    font-weight: 400;
    font-family: 'Nunito', sans-serif;
  }

  @font-face {
    font-family: 'Nunito';
    font-style: normal;
    font-weight: 700;
    src: "https://fonts.googleapis.com/css?family=Nunito";
  }

</style>