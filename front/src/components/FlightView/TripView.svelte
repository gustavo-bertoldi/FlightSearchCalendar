<script lang="ts">
	import type { Trip } from '$types/flight';
	import { createEventDispatcher } from 'svelte';
	import { ExpansionPanels, Button, Divider } from 'svelte-materialify';
	import FlightTile from '$components/FlightView/FlightTile.svelte';

	export let trip: Trip | undefined = undefined;
	const dispatcher = createEventDispatcher();
</script>

{#if trip}
	<div class="d-flex justify-space-between pb-3">
		<span style="font-size: 24px;">Your trip to <b>{trip.outbound.arrivalAirport}</b></span>
		<span style="font-size: 24px;"><b>{trip.price}</b></span>
	</div>
	<Divider />
	<div class="change-flights d-flex justify-space-between align-center">
		<span style="font-size: 18px; padding: 20px 0px;"
			>Departing on {trip.outbound.departureDate}</span
		>
		<Button class="change-flights-btn" text on:click={() => dispatcher('changeFlights')}
			>Change flights</Button
		>
	</div>
	<ExpansionPanels class="outbound-flight">
		<FlightTile itinerary={trip.outbound} validatingAirline={trip.validatingAirline} />
	</ExpansionPanels>
	<span style="font-size: 18px; padding: 20px 0px;">Returning on {trip.inbound.departureDate}</span>
	<ExpansionPanels class="inbound-flight">
		<FlightTile itinerary={trip.inbound} validatingAirline={trip.validatingAirline} />
	</ExpansionPanels>
{/if}
