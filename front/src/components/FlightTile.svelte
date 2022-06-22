<script lang="ts">
  import type { FlightItinerary } from "$types/flight";
  import { ExpansionPanel, Row, Col, Icon, Button } from "svelte-materialify";
  import { mdiAirplaneTakeoff, mdiAirplaneLanding, mdiClockTimeFourOutline } from '@mdi/js';

  export let validatingAirline: string;
  export let itinerary: FlightItinerary;
  export let price: string | undefined = undefined;
  export let onSelect: (() => void) | undefined = undefined;

  function carrierImgErrorHandler(this: HTMLImageElement): void {
    this.onerror = null;
	  this.src = 'airplane-tail.png';
  }
</script>

<ExpansionPanel>
  <span style="width: 100%" slot="header">
    <Row class="d-flex align-center">
      <Col cols={3} sm={2} md={1}>
        <img
          src={`https://s1.apideeplink.com/images/airlines/${validatingAirline}.png`}
          on:error={carrierImgErrorHandler}
          alt="Carrier logo"
          style="width: inherit;"
        />
      </Col>
      <Col cols={5} sm={4} class="d-flex flex-column align-center">
        <span class="flight-upper-row flight-row">
          <Icon class="flight-row-icon" size="25px" path={mdiAirplaneTakeoff} />
          {itinerary.departureAirport} &bull; {itinerary.departureTime}
        </span>
        <span class="flight-bottom-row flight-row">
          <Icon class="flight-row-icon" size="25px" path={mdiAirplaneLanding} />
          {itinerary.arrivalAirport} &bull; {itinerary.arrivalTime}
        </span>
      </Col>
      <Col cols={4} sm={4} class="d-flex flex-column align-center">
        <span class="flight-upper-row flight-row">
          <Icon class="flight-row-icon" size="25px" path={mdiClockTimeFourOutline} />
          {itinerary.duration}
        </span>
        <span class="flight-bottom-row flight-stops-row">{itinerary.stops}</span>
      </Col>
      {#if price}
        <Col cols={12} sm={2} class="d-flex justify-center align-center">
          <span class="flight-price-row flight-row">{price}</span>
        </Col>
      {/if}
    </Row>
  </span>
  <Row class="d-flex align-center justify-center">
    {@const flightColSize = itinerary.segments.length <= 2 ? 4 : 2}
    {#each itinerary.segments as segment, i}
      <Col cols={12} lg={flightColSize} class="flight-details d-flex justify-center">
        <div class="d-flex flex-column">
          <span class="flight-row justify-center">
            <Icon class="flight-row-icon" size="25px" path={mdiAirplaneTakeoff} />
            {segment.origin} &bull; {segment.departureTime}
          </span>
          <div class="d-flex align-center justify-center" style="min-width: 270px;">
            <div class="vertical-line" />
            <span class="flight-segment-duration">{segment.duration}</span>
          </div>
          <span class="flight-row justify-center">
            <Icon class="flight-row-icon" size="25px" path={mdiAirplaneLanding} />
            {segment.destination} &bull; {segment.arrivalTime}
          </span>
          <span class="flight-details justify-center" style="width: 100%">
            {segment.carrierCode}
            {segment.flightNumber} &bull; Operated by {segment.carrierName} &bull; {segment.class}
          </span>
        </div>
      </Col>
      {#if i < itinerary.segments.length - 1}
        <Col cols={12} lg={2} class="d-flex flex-column justify-center flight-details mb-3">
          <span style="text-align: center;">Stop in <b>{segment.destination}</b></span>
          <span style="text-align: center;">{segment.stopDuration}</span>
        </Col>
      {/if}
    {/each}
    {#if onSelect} 
    <Col cols={12} class="d-flex flex-column justify-center">
      <Button class="select-flight-btn" text on:click={onSelect}>Select flight</Button>
    </Col>
    {/if}
  </Row>
</ExpansionPanel>

<style>
  	:root {
		--amadeus-blue: rgb(0, 94, 184);
	}

	span.flight-row {
		font-weight: bold;
		display: flex;
		align-items: center;
	}

	span.flight-upper-row {
		margin-bottom: 15px;
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

	:global(button.select-flight-btn),
	:global(button.change-outbound-btn),
	:global(button.select-return-btn),
	:global(button.change-flights-btn) {
		color: var(--amadeus-blue);
	}
</style>