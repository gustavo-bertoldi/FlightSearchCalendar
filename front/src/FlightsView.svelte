<script>
  import { format } from "date-fns";
  import { mdiAirplaneTakeoff, mdiAirplaneLanding, mdiClockTimeFourOutline } from "@mdi/js";
  import { MaterialApp, Row, Col, ExpansionPanel, ExpansionPanels, Icon, Button } from "svelte-materialify";
  import { getContext } from "svelte";

  const API_URL = getContext('API_URL');
  let offers = [];
  let airlineMap = {};

  /**
   * Helper function to delete previous flight data
   */
  export function resetFlights() {
    offers = [];
  }

  /**
   * Listener for the response of a flights offer search from the FlightSearch component
   * Prepare this component's data to show the flights offers received
   * @param {object} data
   * @property {object} data.flights Response received from the backend containing the flight offers
   * @property {string} data.departureDate Departure date after verification in the format 'yyyy-MM-dd'
   * @property {string} data.returnDate Return date after verification in the format 'yyyy-MM-dd'
   * @property {string} data.origin IATA code of the origin
   * @property {string} data.destination IATA code of the destination
   * @property {number} data.adults Number of adults
   * @property {string} data.class Class selected
   * @property {string?} data.selectedDepartureDate Departure date entered in the form in the format 'yyyy-MM-dd'. Only present when search is for calendar filling.
   * @property {string?} data.selectedReturnDate Return date entered in the form in the format 'yyyy-MM-dd'. Only present when search is for calendar filling.
   */
  export async function flightSearchListener(data) {
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


      offer.totalDuration = formatDuration(offer.itineraries[0].duration);

      offer.departureAirport = offer.itineraries[0].segments[0].departure.iataCode;
      offer.arrivalAirport = offer.itineraries[0].segments[nbSegments - 1].arrival.iataCode;

      offer.originCity = data.originCity;
      offer.destinationCity = data.destinationCity;

      offer.itineraries[0].segments = offer.itineraries[0].segments.map((segment, i) => {
        segment.departureTime = format(new Date(segment.departure.at), 'HH:mm');
        let arrivalTime = new Date(segment.arrival.at);
        segment.arrivalTime = format(arrivalTime, 'HH:mm');

        segment.duration = formatDuration(segment.duration);
        segment.segmentClass = formatString(offer.travelerPricings[0].fareDetailsBySegment.find(fd => fd.segmentId === segment.id).cabin.replace('_', ' ')) || '';

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

  /**
   * Helper function to convert a string in the format PTxxHyyM to xx h yy m
   * Takes into account special cases when hours or minutes are equal to zero
   * @param str Input value
   * @return Formatted string
   */
  function formatDuration(str) {
    let hasHours = str.includes('H');
    let hasMinutes = str.includes('M')
    let durationHours = hasHours ? str.split('PT')[1].split('H')?.[0] : '0';
    let durationMinutes;
    let formatted;

    if (hasHours && hasMinutes) {
      durationMinutes = str.split('PT')[1].split('H')[1].split('M')[0];
      formatted = `${durationHours} h ${durationMinutes} min`;
    } else if (hasMinutes) {
      durationMinutes = str.split('PT')[1].split('M')[0];
      formatted = `${durationMinutes} min`;
    } else {
      formatted = `${durationHours} h`;
    }

    return formatted;
  }

  /**
   * Helper function to convert a uppercase string to first-letter uppercase
   * Ex.: NEW YORK CITY -> New York City
   * @param {string} str Input uppercase string
   * @returns {string} Output
   */
  function formatString(str) {
    str = str.split(' ');
    str = str.map(word => word = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
    return str.join(' ');
  }

  /**
   * Helper function to build a map-like object from airline code to its business name
   * Ex.: DL -> DELTA AIRLINES
   * @param {object} offers Offers received from backend, from which the airline codes are going to be extracted
   * @returns {Promise} Resolves when response is received from backed and map is ready
   */
  function buildAirlineMap(offers) {
    return new Promise((resolve, reject) => {
      let airlines = [];
      offers.forEach(offer => {
        offer.itineraries[0].segments.forEach(segment => {
          let alCode = segment?.operating?.carrierCode || '';
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
              <img 
                src={`https://s1.apideeplink.com/images/airlines/${offer.validatingAirlineCodes[0]}.png`} 
                on:error={function errHandler() {this.onerror=null; this.src='airplane-tail.png'}} 
                alt="Carrier logo" 
                style="width: inherit;"
              />
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
        <Row class="d-flex align-center justify-center">
          {@const flightColSize = offer.itineraries[0].segments.length <= 2 ? 4 : 2}
          {#each offer.itineraries[0].segments as segment, i }
            {@const segCarrCode = segment?.operating?.carrierCode || segment?.carrierCode}
            {@const carrBusinessName = airlineMap[segCarrCode]?.businessName || ''}
            <Col cols={12} lg={flightColSize} class="flight-details d-flex justify-center">
              <div class="d-flex flex-column">
                <span class="flight-row justify-center">
                  <Icon class="flight-row-icon" size="25px" path={mdiAirplaneTakeoff}/>
                  {segment.departure.iataCode}  &bull; {segment.departureTime}
                </span>
                <div class="d-flex align-center justify-center" style="min-width: 270px;">
                  <div class="vertical-line"></div>
                  <span class="flight-segment-duration">{segment.duration}</span>
                </div>
                <span class="flight-row justify-center">
                  <Icon class="flight-row-icon" size="25px" path={mdiAirplaneLanding}/>
                  {segment.arrival.iataCode}  &bull; {segment.arrivalTime}
                </span>
                <span class="flight-details justify-center" style="width: 100%">
                  {segment.carrierCode} {segment.number} &bull; Operated by {carrBusinessName} &bull; {segment.segmentClass}
                </span>
              </div>
            </Col>
            {#if i < offer.itineraries[0].segments.length - 1}
            <Col cols={12} lg={2} class="d-flex flex-column justify-center flight-details mb-3">
              <span style="text-align: center;">Stop in <b>{segment.arrival.iataCode}</b></span>
              <span style="text-align: center;">{segment.stopDuration}</span>
            </Col>
            {/if}
          {/each}
          <Col cols={12} class="d-flex flex-column justify-center">
            <Button class="select-return-btn" text>Select flight</Button>
          </Col>
        </Row>
      </ExpansionPanel>
    {/each}
  </ExpansionPanels>
</MaterialApp>

<style>
  :root {
    --amadeus-blue: rgb(0,94,184);
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
    text-align: center;
  }

  :global(button.select-return-btn) {
    color: var(--amadeus-blue);
  }


</style>
