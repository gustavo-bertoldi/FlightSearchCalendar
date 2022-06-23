<script>
	import { mdiAirplaneTakeoff, mdiAirplaneLanding, mdiClockTimeFourOutline } from '@mdi/js';
	import { createEventDispatcher } from 'svelte';
	import { MaterialApp, Row, Col, ExpansionPanel, ExpansionPanels, Icon, Button, Divider } from 'svelte-materialify';

	let offers = [];
	let chosenOffer;
	const dispatch = createEventDispatcher();

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
		offers = data;
	}

	function selectFlight(offer) {
		document.querySelector('div.outbound-flights').style.display = 'none';
		document.querySelector('div.inbound-flights').style.display = 'block';
		chosenOffer = offer;
		dispatch('outboundSelected');
	}

	export function changeDepart() {
		document.querySelector('div.outbound-flights').style.display = 'flex';
		document.querySelector('div.inbound-flights').style.display = 'none';
		chosenOffer = null;
		dispatch('changeDepart');
	}

	function selectInbound(selectedInbound) {
		document.querySelector('div.outbound-flights').style.display = 'none';
		document.querySelector('div.inbound-flights').style.display = 'none';
		let trip = {
			validatingAirline: chosenOffer.validatingAirline,
			outbound: chosenOffer.outbound,
			inbounds: [selectedInbound]
		};
		dispatch('offerChosen', trip);
	}

	/**
	 * Helper function to delete previous flight data
	 */
	export function resetFlights() {
		offers = [];
		changeDepart();
	}
</script>

<MaterialApp>
	<ExpansionPanels class="outbound-flights">
		{#each offers as offer}
			<ExpansionPanel>
				<span style="width: 100%" slot="header">
					<Row class="d-flex align-center">
						<Col cols={3} sm={2} md={1}>
							<img
								src={`https://s1.apideeplink.com/images/airlines/${offer.validatingAirline}.png`}
								on:error={function errHandler() {
									this.onerror = null;
									this.src = 'airplane-tail.png';
								}}
								alt="Carrier logo"
								style="width: inherit;" />
						</Col>
						<Col cols={5} sm={4} class="d-flex flex-column align-center">
							<span class="flight-upper-row flight-row">
								<Icon class="flight-row-icon" size="25px" path={mdiAirplaneTakeoff} />
								{offer.outbound.departureAirport} &bull; {offer.outbound.departureTime}
							</span>
							<span class="flight-bottom-row flight-row">
								<Icon class="flight-row-icon" size="25px" path={mdiAirplaneLanding} />
								{offer.outbound.arrivalAirport} &bull; {offer.outbound.arrivalTime}
							</span>
						</Col>
						<Col cols={4} sm={4} class="d-flex flex-column align-center">
							<span class="flight-upper-row flight-row">
								<Icon class="flight-row-icon" size="25px" path={mdiClockTimeFourOutline} />
								{offer.outbound.duration}
							</span>
							<span class="flight-bottom-row flight-stops-row">{offer.outbound.stops}</span>
						</Col>
						<Col cols={12} sm={2} class="d-flex justify-center align-center">
							<span class="flight-price-row flight-row">{offer.priceFrom}</span>
						</Col>
					</Row>
				</span>
				<Row class="d-flex align-center justify-center">
					{@const flightColSize = offer.outbound.segments.length <= 2 ? 4 : 2}
					{#each offer.outbound.segments as segment, i}
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
						{#if i < offer.outbound.segments.length - 1}
							<Col cols={12} lg={2} class="d-flex flex-column justify-center flight-details mb-3">
								<span style="text-align: center;">Stop in <b>{segment.destination}</b></span>
								<span style="text-align: center;">{segment.stopDuration}</span>
							</Col>
						{/if}
					{/each}
					<Col cols={12} class="d-flex flex-column justify-center">
						<Button class="select-flight-btn" text on:click={() => selectFlight(offer)}>Select flight</Button>
					</Col>
				</Row>
			</ExpansionPanel>
		{/each}
	</ExpansionPanels>
	<div class="inbound-flights">
		{#if chosenOffer}
			<Row>
				<Col class="d-flex justify-space-between">
					<span style="font-size: 18px;"
						>Flight to <b>{chosenOffer.outbound.arrivalAirport}</b> on {chosenOffer.outbound.departureDate}</span>
					<Button class="change-outbound-btn" text on:click={changeDepart}>Change depart</Button>
				</Col>
			</Row>
			<ExpansionPanels>
				<ExpansionPanel>
					<span style="width: 100%" slot="header">
						<Row class="d-flex align-center">
							<Col cols={3} lg={1}>
								<img
									src={`https://s1.apideeplink.com/images/airlines/${chosenOffer.validatingAirline}.png`}
									on:error={function errHandler() {
										this.onerror = null;
										this.src = 'airplane-tail.png';
									}}
									alt="Carrier logo"
									style="width: inherit;" />
							</Col>
							<Col cols={5} lg={4} class="d-flex flex-column align-center">
								<span class="flight-upper-row flight-row">
									<Icon class="flight-row-icon" size="25px" path={mdiAirplaneTakeoff} />
									{chosenOffer.outbound.departureAirport} &bull; {chosenOffer.outbound.departureTime}
								</span>
								<span class="flight-bottom-row flight-row">
									<Icon class="flight-row-icon" size="25px" path={mdiAirplaneLanding} />
									{chosenOffer.outbound.arrivalAirport} &bull; {chosenOffer.outbound.arrivalTime}
								</span>
							</Col>
							<Col cols={4} lg={4} class="d-flex flex-column align-center">
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
			<div class="mt-4 mb-4">
				<Divider class="mb-4" />
				<span style="font-size: 18px;">Choose the returning flight:</span>
			</div>
			<ExpansionPanels>
				{#each chosenOffer.inbounds as inbound}
					<ExpansionPanel>
						<span style="width: 100%" slot="header">
							<Row class="d-flex align-center">
								<Col cols={3} sm={2} md={1}>
									<img
										src={`https://s1.apideeplink.com/images/airlines/${chosenOffer.validatingAirline}.png`}
										on:error={function errHandler() {
											this.onerror = null;
											this.src = 'airplane-tail.png';
										}}
										alt="Carrier logo"
										style="width: inherit;" />
								</Col>
								<Col cols={5} sm={4} class="d-flex flex-column align-center">
									<span class="flight-upper-row flight-row">
										<Icon class="flight-row-icon" size="25px" path={mdiAirplaneTakeoff} />
										{inbound.departureAirport} &bull; {inbound.departureTime}
									</span>
									<span class="flight-bottom-row flight-row">
										<Icon class="flight-row-icon" size="25px" path={mdiAirplaneLanding} />
										{inbound.arrivalAirport} &bull; {inbound.arrivalTime}
									</span>
								</Col>
								<Col cols={4} sm={4} class="d-flex flex-column align-center">
									<span class="flight-upper-row flight-row">
										<Icon class="flight-row-icon" size="25px" path={mdiClockTimeFourOutline} />
										{inbound.duration}
									</span>
									<span class="flight-bottom-row flight-stops-row">{inbound.stops}</span>
								</Col>
								<Col cols={12} sm={2} class="d-flex justify-center align-center">
									<span class="flight-price-row flight-row">{inbound.priceFormatted}</span>
								</Col>
							</Row>
						</span>
						<Row class="d-flex align-center justify-center">
							{@const flightColSize = inbound.segments.length <= 2 ? 4 : 2}
							{#each inbound.segments as segment, i}
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
								{#if i < inbound.segments.length - 1}
									<Col cols={12} lg={2} class="d-flex flex-column justify-center flight-details mb-3">
										<span style="text-align: center;">Stop in <b>{segment.destination}</b></span>
										<span style="text-align: center;">{segment.stopDuration}</span>
									</Col>
								{/if}
							{/each}
							<Col cols={12} class="d-flex flex-column justify-center">
								<Button class="select-return-btn" text on:click={() => selectInbound(inbound)}>Select flight</Button>
							</Col>
						</Row>
					</ExpansionPanel>
				{/each}
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

	:global(button.select-flight-btn),
	:global(button.change-outbound-btn),
	:global(button.select-return-btn),
	:global(button.change-flights-btn) {
		color: var(--amadeus-blue);
	}

	div.inbound-flights {
		display: none;
	}
</style>
