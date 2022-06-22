<script lang="ts">
  import type { FlightItinerary, FlightOffer, Trip } from '$types/flight';
	import { Row, Col, ExpansionPanels, Button, Divider } from 'svelte-materialify';
  import FlightTile from '$components/FlightTile.svelte';
  import TripView from '$components/TripView.svelte';
  import { offersResult } from '$stores/search-store';

  let offers: FlightOffer[] = $offersResult;
  let chosenOffer: FlightOffer | undefined = undefined;
  $: chosenDepart = chosenOffer?.outbound;
  let chosenReturn: FlightItinerary | undefined = undefined;
  let trip: Trip | undefined = undefined;

  function selectDepart(offer: FlightOffer): void {
    chosenOffer = offer;
  }

  function selectReturn(_return: FlightItinerary): void {
    chosenReturn = _return;
    if (chosenOffer && chosenDepart && chosenReturn) {
      trip = {
        validatingAirline: chosenOffer.validatingAirline,
        price: chosenOffer.priceFrom,
        outbound: chosenDepart,
        inbound: chosenReturn
      }
    }
  }

  function changeDepart(): void {
    chosenOffer = undefined;
    chosenReturn = undefined;
    trip = undefined;
  }

	/**
	 * Helper function to delete previous flight data
	 */
	export function resetFlights(): void {
		offers = [];
		changeDepart();
	}
</script>

{#if !chosenDepart}
	<ExpansionPanels>
		{#each offers as offer}
      <FlightTile itinerary={offer.outbound} price={offer.priceFrom} validatingAirline={offer.validatingAirline} onSelect={() => selectDepart(offer)}/>
		{/each}
	</ExpansionPanels>
  {#if offers.length === 0}
  <span>No flight were found</span>
  {/if}
{/if}
{#if chosenOffer && chosenDepart && !chosenReturn}
	<Row>
		<Col class="d-flex justify-space-between">
			<span style="font-size: 18px;">Flight to <b>{chosenDepart.arrivalAirport}</b> on {chosenDepart.departureDate}</span>
			<Button class="change-outbound-btn" text on:click={changeDepart}>Change depart</Button>
		</Col>
	</Row>
	<ExpansionPanels>
		<FlightTile itinerary={chosenDepart} validatingAirline={chosenOffer.validatingAirline}/>
	</ExpansionPanels>
	<div class="mt-4 mb-4">
		<Divider class="mb-4" />
		<span style="font-size: 18px;">Choose the returning flight:</span>
	</div>
	<ExpansionPanels>
		{#each chosenOffer.inbounds as inbound}
			<FlightTile itinerary={inbound} price={chosenOffer.priceFrom} validatingAirline={chosenOffer.validatingAirline} onSelect={() => selectReturn(inbound)}/>
		{/each}
	</ExpansionPanels>
{/if}
<TripView bind:trip={trip}/>


<style>
	:root {
		--amadeus-blue: rgb(0, 94, 184);
	}

	:global(button.select-flight-btn),
	:global(button.change-outbound-btn),
	:global(button.select-return-btn),
	:global(button.change-flights-btn) {
		color: var(--amadeus-blue);
	}

</style>
