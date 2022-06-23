<script lang="ts">
	import { mdiAirplaneTakeoff, mdiAirplaneLanding, mdiClockTimeFourOutline } from '@mdi/js';
	import type { FlightOffer } from 'src/@types';
	import { createEventDispatcher } from 'svelte';
	import { MaterialApp, Row, Col, ExpansionPanel, ExpansionPanels, Icon, Button, Divider } from 'svelte-materialify';

	let chosenOffer: FlightOffer;
	let offerSet = false;
	const dispatch = createEventDispatcher();

	export function setChosenOffer(data: FlightOffer) {
		chosenOffer = data;
		offerSet = true;
		let tripView = document.getElementById('trip-view');
		if (tripView) tripView.style.display = 'flex';
	}

	export function resetChosenOffer() {
		let tripView = document.getElementById('trip-view');
		if (tripView) tripView.style.display = 'none';
		offerSet = false;
	}

	function carrierImgErrorHandler(this: HTMLImageElement) {
		this.onerror = null;
		this.src = 'airplane-tail.png';
	}

	function changeFlights() {
		resetChosenOffer();
		dispatch('changeFlights');
	}
</script>

<MaterialApp>
	<div class="d-flex flex-column" id="trip-view">
		{#if offerSet}
			<div class="d-flex justify-space-between pb-3">
				<span style="font-size: 24px;">Your trip to <b>{chosenOffer.outbound.arrivalAirport}</b></span>
				<span style="font-size: 24px;"><b>{chosenOffer.inbounds[0].priceFormatted}</b></span>
			</div>
			<Divider />
			<div class="change-flights d-flex justify-space-between align-center">
				<span style="font-size: 18px; padding: 20px 0px;">Departing on {chosenOffer.outbound.departureDate}</span>
				<Button class="change-flights-btn" text on:click={() => changeFlights()}>Change flights</Button>
			</div>
			<ExpansionPanels class="outbound-flight">
				<ExpansionPanel>
					<span style="width: 100%" slot="header">
						<Row class="d-flex align-center">
							<Col cols={2} lg={1}>
								<img
									src={`https://s1.apideeplink.com/images/airlines/${chosenOffer.validatingAirline}.png`}
									on:error={carrierImgErrorHandler}
									alt="Carrier logo"
									style="width: inherit;" />
							</Col>
							<Col cols={6} lg={5} class="d-flex flex-column align-center">
								<span class="flight-upper-row flight-row">
									<Icon class="flight-row-icon" size="25px" path={mdiAirplaneTakeoff} />
									{chosenOffer.outbound.departureAirport} &bull; {chosenOffer.outbound.departureTime}
								</span>
								<span class="flight-bottom-row flight-row">
									<Icon class="flight-row-icon" size="25px" path={mdiAirplaneLanding} />
									{chosenOffer.outbound.arrivalAirport} &bull; {chosenOffer.outbound.arrivalTime}
								</span>
							</Col>
							<Col cols={4} lg={5} class="d-flex flex-column align-center">
								<span class="flight-upper-row flight-row">
									<Icon class="flight-row-icon" size="25px" path={mdiClockTimeFourOutline} />
									{chosenOffer.outbound.duration}
								</span>
								<span class="flight-bottom-row flight-stops-row">{chosenOffer.outbound.stops}</span>
							</Col>
						</Row>
					</span>
					<Row class="d-flex align-center justify-center">
						{@const flightColSize = chosenOffer.outbound.segments.length <= 2 ? 4 : 2}
						{#each chosenOffer.outbound.segments as segment, i}
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
							{#if i < chosenOffer.outbound.segments.length - 1}
								<Col cols={12} lg={2} class="d-flex flex-column justify-center flight-details mb-3">
									<span style="text-align: center;">Stop in <b>{segment.destination}</b></span>
									<span style="text-align: center;">{segment.stopDuration}</span>
								</Col>
							{/if}
						{/each}
					</Row>
				</ExpansionPanel>
			</ExpansionPanels>
			<span style="font-size: 18px; padding: 20px 0px;">Returning on {chosenOffer.inbounds[0].departureDate}</span>
			<ExpansionPanels class="inbound-flight">
				<ExpansionPanel>
					<span style="width: 100%" slot="header">
						<Row class="d-flex align-center">
							<Col cols={2} lg={1}>
								<img
									src={`https://s1.apideeplink.com/images/airlines/${chosenOffer.validatingAirline}.png`}
									on:error={carrierImgErrorHandler}
									alt="Carrier logo"
									style="width: inherit;" />
							</Col>
							<Col cols={6} lg={5} class="d-flex flex-column align-center">
								<span class="flight-upper-row flight-row">
									<Icon class="flight-row-icon" size="25px" path={mdiAirplaneTakeoff} />
									{chosenOffer.inbounds[0].departureAirport} &bull; {chosenOffer.inbounds[0].departureTime}
								</span>
								<span class="flight-bottom-row flight-row">
									<Icon class="flight-row-icon" size="25px" path={mdiAirplaneLanding} />
									{chosenOffer.inbounds[0].arrivalAirport} &bull; {chosenOffer.inbounds[0].arrivalTime}
								</span>
							</Col>
							<Col cols={4} lg={5} class="d-flex flex-column align-center">
								<span class="flight-upper-row flight-row">
									<Icon class="flight-row-icon" size="25px" path={mdiClockTimeFourOutline} />
									{chosenOffer.inbounds[0].duration}
								</span>
								<span class="flight-bottom-row flight-stops-row">{chosenOffer.inbounds[0].stops}</span>
							</Col>
						</Row>
					</span>
					<Row class="d-flex align-center justify-center">
						{@const flightColSize = chosenOffer.inbounds[0].segments.length <= 2 ? 4 : 2}
						{#each chosenOffer.inbounds[0].segments as segment, i}
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
							{#if i < chosenOffer.inbounds[0].segments.length - 1}
								<Col cols={12} lg={2} class="d-flex flex-column justify-center flight-details mb-3">
									<span style="text-align: center;">Stop in <b>{segment.destination}</b></span>
									<span style="text-align: center;">{segment.stopDuration}</span>
								</Col>
							{/if}
						{/each}
					</Row>
				</ExpansionPanel>
			</ExpansionPanels>
		{/if}
	</div>
</MaterialApp>

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
	:global(button.select-return-btn) {
		color: var(--amadeus-blue);
	}
</style>
