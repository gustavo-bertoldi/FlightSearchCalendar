<script lang="ts">
	import type { FlightItinerary, FlightOffer } from '$types/flight';
	import { Row, Col, ExpansionPanels, Button, Divider } from 'svelte-materialify';
	import FlightTile from '$components/FlightView/FlightTile.svelte';
	import TripView from '$components/FlightView/TripView.svelte';
	import { offersResult, chosenOffer, chosenReturn, trip } from '$stores/flight_search';
	import { selectedPriceCell } from '$stores/calendar';

	$: chosenDepart = $chosenOffer?.outbound;
	selectedPriceCell.subscribe(() => {
		changeDepart();
	});
	offersResult.subscribe((v) => {
		if (v === undefined) changeDepart();
	});

	function selectDepart(offer: FlightOffer): void {
		$chosenOffer = offer;
	}

	function selectReturn(_return: FlightItinerary): void {
		$chosenReturn = _return;
		if ($chosenOffer && chosenDepart && $chosenReturn) {
			$trip = {
				validatingAirline: $chosenOffer.validatingAirline,
				price: $chosenOffer.priceFrom,
				outbound: chosenDepart,
				inbound: $chosenReturn
			};
		}
	}

	function changeDepart(): void {
		$chosenOffer = undefined;
		$chosenReturn = undefined;
		$trip = undefined;
	}
</script>

{#if $offersResult}
	{#if $offersResult.length === 0}
		<div class="d-flex justify-center">
			<span>No flights were found</span>
		</div>
	{/if}
	{#if !chosenDepart}
		<ExpansionPanels>
			{#each $offersResult as offer}
				<FlightTile
					itinerary={offer.outbound}
					price={offer.priceFrom}
					validatingAirline={offer.validatingAirline}
					onSelect={() => selectDepart(offer)}
				/>
			{/each}
		</ExpansionPanels>
	{/if}
	{#if $chosenOffer && chosenDepart && !$chosenReturn}
		<Row>
			<Col class="d-flex justify-space-between">
				<span style="font-size: 18px;"
					>Flight to <b>{chosenDepart.arrivalAirport}</b> on {chosenDepart.departureDate}</span
				>
				<Button class="change-outbound-btn" text on:click={changeDepart}>Change depart</Button>
			</Col>
		</Row>
		<ExpansionPanels>
			<FlightTile itinerary={chosenDepart} validatingAirline={$chosenOffer.validatingAirline} />
		</ExpansionPanels>
		<div class="mt-4 mb-4">
			<Divider class="mb-4" />
			<span style="font-size: 18px;">Choose the returning flight:</span>
		</div>
		<ExpansionPanels>
			{#each $chosenOffer.inbounds as inbound}
				<FlightTile
					itinerary={inbound}
					price={$chosenOffer.priceFrom}
					validatingAirline={$chosenOffer.validatingAirline}
					onSelect={() => selectReturn(inbound)}
				/>
			{/each}
		</ExpansionPanels>
	{/if}
{/if}
<TripView bind:trip={$trip} on:changeFlights={changeDepart} />

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
