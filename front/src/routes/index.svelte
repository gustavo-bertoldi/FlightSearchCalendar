<script lang="ts">
	import Calendar from '$components/Calendar.svelte';
	import FlightSearch from '$components/FlightSearch.svelte';
	import FlightsView from '$components/FlightsView.svelte';
	import TripView from '$components/FlightView/TripView.svelte';
	import { MaterialApp, Row, Col, Snackbar } from 'svelte-materialify';

	let errorBar = false;

	function showError() {
		errorBar = true;
	}
</script>

<main>
	<MaterialApp>
		<Row class="d-flex justify-center pl-8 pr-8 pl-md-0 pr-md-0">
			<Col cols={5} sm={3} md={2} xl={1}><img width="100%" src="amadeus_logo.png" alt="" /></Col>
			<Col cols={12} sm={12} md={8} xl={10} />
			<Col cols={0} sm={0} md={2} xl={1} />
		</Row>
		<Row class="d-flex justify-center pl-8 pr-8 pl-md-0 pr-md-0">
			<Col cols={12} sm={12} md={8}>
				<FlightSearch on:error={showError} />
			</Col>
		</Row>
		<Row class="d-flex justify-center pl-8 pr-8 pl-md-0 pr-md-0">
			<Col sm={12} md={10} lg={8}>
				<Calendar on:error={showError} />
			</Col>
		</Row>
		<Row class="d-flex justify-center pl-8 pr-8 pl-md-0 pr-md-0">
			<Col sm={12} md={10} lg={7}>
				<FlightsView />
			</Col>
		</Row>
		<Row class="d-flex justify-center pl-8 pr-8 pl-md-0 pr-md-0">
			<Col sm={12} md={10} lg={7}>
				<TripView />
			</Col>
		</Row>
		<Snackbar class="flex-column" bind:active={errorBar} top center timeout={5000}>
			An internal error occurred. Please try again.
		</Snackbar>
	</MaterialApp>
</main>

<style>
</style>
