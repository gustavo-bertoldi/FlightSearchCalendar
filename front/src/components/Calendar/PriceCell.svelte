<script lang="ts">
	import { createEventDispatcher, tick } from 'svelte';
	import { ProgressCircular } from 'svelte-materialify';
	import { CONSTANTS } from '$stores/constants';
	import {
		selectedPriceCell,
		departureDates,
		returnDates,
		calendar,
		fetchNewPrices
	} from '$stores/calendar';
	import { departureDateFormatted, returnDateFormatted } from '$stores/flight_search';
	import { isAfter } from 'date-fns';
	import type { CalendarPrice, Datepair, DateString } from '$types/calendar';

	export let cheap = false;
	export let expensive = false;
	export let _departureDate: DateString;
	export let _returnDate: DateString;
	export let bottomLeftCorner: boolean;
	export let price: CalendarPrice | undefined;

	$: naPrice = !price?.price;
	$: loading = !price;
	$: currentDates =
		!loading && _departureDate === $departureDateFormatted && _returnDate === $returnDateFormatted;
	$: invalidDatepair = isAfter(new Date(_departureDate), new Date(_returnDate));
	$: constants = $CONSTANTS;
	$: _class =
		`${cheap ? 'cheap' : ''} ${!cheap && expensive ? 'expensive' : ''} ` +
		`${naPrice ? 'na-price' : ''} ${bottomLeftCorner ? 'bottom-left-corner' : ''}` +
		`${currentDates ? 'current-dates' : ''} ${loading ? 'loading' : ''}`;

	let dispatcher = createEventDispatcher();

	async function click() {
		$selectedPriceCell = {
			departureDate: _departureDate,
			returnDate: _returnDate
		};
		await tick();
		let newDatepairs: Datepair[] = [];
		$departureDates.forEach((dep) => {
			$returnDates.forEach((ret) => {
				let datepair: Datepair = `${dep.date}>${ret.date}`;
				if (!Object.prototype.hasOwnProperty.call($calendar, datepair)) newDatepairs.push(datepair);
			});
		});

		$fetchNewPrices(newDatepairs)
			.then((prices) => ($calendar = { ...$calendar, ...prices }))
			.catch(() => dispatcher('error'));
	}
</script>

<div class={_class} on:click={click}>
	{#if !invalidDatepair}
		{#if loading}
			<ProgressCircular indeterminate color={constants.AMADEUS_BLUE} />
		{:else}
			<span contenteditable="false">{price?.priceFormatted || 'N/A'}</span>
		{/if}
	{/if}
</div>

<style>
	:root {
		--price-cell-background: rgb(155, 202, 236);
		--cell-cheap: rgb(101, 206, 152);
		--cell-expensive: rgb(213, 122, 161);
		--cell-loading: rgb(202, 220, 233);
		--cell-hover: rgb(184, 213, 233);
		--cell-cheap-hover: rgb(143, 223, 181);
		--cell-expensive-hover: rgb(231, 154, 188);
		--cell-na-price: rgb(202, 220, 233);
		--cell-text: rgb(0, 53, 102);
		--cheap-text: rgb(0, 85, 41);
		--expensive-text: rgb(124, 0, 54);
	}

	div {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 50px;
		background-color: var(--price-cell-background);
	}

	div:hover {
		cursor: pointer;
		background-color: var(--cell-hover);
	}

	div.loading {
		background-color: var(--cell-loading);
		pointer-events: none;
	}

	div.loading:hover {
		cursor: default;
	}

	div.cheap {
		background-color: var(--cell-cheap);
	}

	div.cheap:hover {
		background-color: var(--cell-cheap-hover);
	}

	div.expensive {
		background-color: var(--cell-expensive);
	}

	div.expensive:hover {
		background-color: var(--cell-expensive-hover);
	}

	div.na-price {
		background-color: var(--cell-na-price);
		pointer-events: none;
	}

	div.na-price:hover {
		cursor: default;
	}

	div.current-dates {
		box-shadow: inset 0px 0px 18px 5px var(--cell-text);
		pointer-events: none;
	}

	div.current-dates.cheap {
		box-shadow: inset 0px 0px 18px 5px var(--cheap-text);
	}

	div.current-dates.expensive {
		box-shadow: inset 0px 0px 18px 5px var(--expensive-text);
	}

	span {
		font-weight: 500;
		color: var(--cell-text);
		padding: 5px;
	}

	div.cheap > span {
		color: var(--cheap-text);
	}

	div.expensive > span {
		color: var(--expensive-text);
	}

	div.bottom-left-corner {
		border-bottom-left-radius: 10px;
	}
</style>
