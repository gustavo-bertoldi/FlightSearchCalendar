<script>
  import { format } from "date-fns";
  import { mdiAirplaneTakeoff, mdiAirplaneLanding, mdiClockTimeFourOutline  } from "@mdi/js";
  import {
    MaterialApp,
    Row,
    Col,
    ExpansionPanel,
    ExpansionPanels,
    Icon,
  } from "svelte-materialify";
  import { getContext, onMount } from "svelte";
  import * as breakpoints from "svelte-materialify/src/utils/breakpoints.js";

  const API_URL = getContext('API_URL');
  let offers = [];
  let airlineMap = {};

  export function resetFlights() {
    offers = [];
  }

  export function flightSearchListener(data) {
    const currencyFormatter = Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.offers[0].price.currency
    });

    buildAirlineMap(data.offers);

    offers = data.offers.map(offer => {
      offer.price.total = currencyFormatter.format(offer.price.total);

      let nbSegments = offer.itineraries[0].segments.length;
      offer.stops = `${nbSegments == 1 ? 'Nonstop' : (nbSegments - 1) + ' stop' + (nbSegments >= 3 ? 's' : '')}`;

      let departureDate = new Date(offer.itineraries[0].segments[0].departure.at);
      let arrivalDate = new Date(offer.itineraries[0].segments[nbSegments - 1].arrival.at)
      offer.departureTime = format(departureDate, 'HH:mm');
      offer.arrivalTime = format(arrivalDate, 'HH:mm');

      let durationHours = offer.itineraries[0].duration.split('PT')[1].split('H')[0];
      let durationMinutes = offer.itineraries[0].duration.split('PT')[1].split('H')[1].split('M')[0];
      offer.totalDuration = `${durationHours} h ${durationMinutes} min`;

      offer.departureAirport = offer.itineraries[0].segments[0].departure.iataCode;
      offer.arrivalAirport = offer.itineraries[0].segments[nbSegments - 1].arrival.iataCode;

      offer.originCity = data.originCity;
      offer.destinationCity = data.destinationCity;

      offer.itineraries[0].segments = offer.itineraries[0].segments.map((segment, i) => {
        segment.departureTime = format(new Date(segment.departure.at), 'HH:mm');
        let arrivalTime = new Date(segment.arrival.at);
        segment.arrivalTime = format(arrivalTime, 'HH:mm');

        let durationHours = segment.duration.split('PT')[1].split('H')[0];
        let durationMinutes = segment.duration.split('PT')[1].split('H')[1].split('M')[0];
        segment.duration = `${durationHours} h ${durationMinutes} min`;

        if (i < nbSegments - 1) {
          let nextDeparture = new Date(offer.itineraries[0].segments[i + 1].departure.at);
          let stopTime = nextDeparture - arrivalTime;
          let minutes = (stopTime/(60*1000))%60;
          let hours = Math.floor(stopTime/(60*60*1000));
          segment.stopDuration = `${hours} h ${minutes} min`;
        }
        return segment;
      });
      return offer;
    });
  }

  function formatString(str) {
    str = str.split(' ');
    str = str.map(word => word = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
    return str.join(' ');
  }

  function buildAirlineMap(offers) {
    return new Promise((resolve, reject) => {
      let airlines = [];
      offers.forEach(offer => {
        offer.itineraries[0].segments.forEach(segment => {
          let alCode = segment.operating.carrierCode;
          if (!airlines.includes(alCode)) airlines.push(alCode);
        });
      });

      const url = `${API_URL}/airline-lookup`;
      const options = {
        method: 'POST',
        body: JSON.stringify(airlines),
        headers: { "Content-Type": "application/json; charset=UTF-8" }
      }
      const request = new Request(url, options);

      fetch(request)
        .then(response => response.json())
        .then(airlines => {
          airlines.forEach(airline => {
            if (!airlineMap[airline.iataCode]) {
              airline.businessName = formatString(airline.businessName);
              airlineMap[airline.iataCode] = airline;
            }
          });
          resolve();
        });
    });
  }

</script>

<MaterialApp>
  <ExpansionPanels multiple>
    {#each offers as offer}
      <ExpansionPanel>
        <span style="width: 100%" slot="header">
          <Row class="d-flex align-center">
            <Col cols={2} lg={1}>
              <img src={`https://s1.apideeplink.com/images/airlines/${offer.validatingAirlineCodes[0]}.png`} alt="" style="width: inherit;"/>
            </Col>
            <Col cols={3} lg={4} class="d-flex flex-column align-center">
              <span class="flight-upper-row flight-row">
                <Icon class="flight-row-icon" size="25px" path={mdiAirplaneTakeoff}/>
                {offer.departureAirport} &bull; {offer.departureTime}
              </span>
              <span class="flight-bottom-row flight-row">
                <Icon class="flight-row-icon" size="25px" path={mdiAirplaneLanding}/>
                {offer.arrivalAirport} &bull; {offer.arrivalTime}
              </span>
            </Col>
            <Col cols={4} lg={4} class="d-flex flex-column align-center">
              <span class="flight-upper-row flight-row">
                <Icon class="flight-row-icon" size="25px" path={mdiClockTimeFourOutline}/>
                {offer.totalDuration}
              </span>
              <span class="flight-bottom-row flight-stops-row">{offer.stops}</span>
            </Col>
            <Col cols={2} lg={2} class="d-flex justify-center align-center">
              <span class="flight-price-row flight-row">{offer.price.total}</span>
            </Col>
          </Row>
        </span>
        <Row class="d-flex align-center">
          {#each offer.itineraries[0].segments as segment, i }
            {@const airlineBName = airlineMap[segment.carrierCode] ? airlineMap[segment.carrierCode].businessName : ''}
            <Col cols={12} lg={2} class="flight-details d-flex justify-center">
              <div class="d-flex flex-column">
                <span class="flight-row">
                  <Icon class="flight-row-icon" size="25px" path={mdiAirplaneTakeoff}/>
                  {segment.departure.iataCode}  &bull; {segment.departureTime}
                </span>
                <div class="d-flex align-center">
                  <div class="vertical-line"></div>
                  <span class="flight-segment-duration">{segment.duration}</span>
                </div>
                <span class="flight-row">
                  <Icon class="flight-row-icon" size="25px" path={mdiAirplaneLanding}/>
                  {segment.arrival.iataCode}  &bull; {segment.arrivalTime}
                </span>
                <span class="flight-details">{segment.carrierCode} {segment.number} &bull; {airlineBName}</span>
              </div>
            </Col>
            {#if i < offer.itineraries[0].segments.length - 1}
            <Col cols={12} lg={2} class="d-flex flex-column d-flex justify-center flight-details">
              <span style="text-align: center;">Stop in {segment.arrival.iataCode}</span>
              <span style="text-align: center;">{segment.stopDuration}</span>
            </Col>
            {/if}
          {/each}
        </Row>
      </ExpansionPanel>
    {/each}
  </ExpansionPanels>
</MaterialApp>

<style>
  @font-face {
    font-family: "Nunito";
    font-style: normal;
    font-weight: 700;
    src: "https://fonts.googleapis.com/css?family=Nunito";
  }
  span.flight-row {
    font-weight: bold;
    display: flex;
    align-items: center;
  }

  span.flight-upper-row {
    margin-bottom: 15px;
  }

  span.flight-price-row {
    font-size: 19px;
  }

  :global(i.flight-row-icon) {
    margin-right: 8px;
  }

  div.vertical-line {
    width: 2px;
    border-left: 2px dotted #949494;
    height: 50px;
    margin: 5px 18px 5px 12px;
  }

  span.flight-segment-duration {
    margin-left: 5px;
  }

  span.flight-details {
    color: #949494;
    margin-top: 10px;
    font-size: 14px;
    height: 50px;
  }


</style>
