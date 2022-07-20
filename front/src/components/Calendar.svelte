<script lang="ts">
	import { onMount, tick, createEventDispatcher } from 'svelte';
	import { format, addDays, isAfter, isBefore, differenceInDays } from 'date-fns';
	import { Icon, Button } from 'svelte-materialify';
	import {
		mdiArrowLeftBold,
		mdiArrowRightBold,
		mdiArrowUpBold,
		mdiArrowDownBold,
		mdiCalendar,
		mdiClose
	} from '@mdi/js';
	import { offersResult } from '$stores/flight_search';
	import {
		fetchCalendar,
		fetchNewPrices,
		calendar,
		departureDates,
		returnDates
	} from '$stores/calendar';
	import PriceCell from './Calendar/PriceCell.svelte';
	import DateCell from './Calendar/DateCell.svelte';
	import type {
		CalendarDate,
		CalendarScrollDirection,
		CalendarScrollType,
		Datepair,
		DateString,
		DateStringFormatted
	} from '$types/calendar';

	$: calendarButtonVisible = !!$offersResult && $offersResult.length > 0;
	let calendarViewBtnVisible = true;
	$: closeCalendarBtnVisible = !calendarViewBtnVisible;
	$: visible = !!$offersResult && closeCalendarBtnVisible;

	//Take only prices that are currently shown in the calendar
	$: prices = Object.entries($calendar)
		.filter((x) => {
			let [departure, _return] = parseDatepair(x[0] as Datepair);
			return (
				x[1].price &&
				$departureDates.filter((x) => x.date === departure).length > 0 &&
				$returnDates.filter((x) => x.date === _return).length > 0
			);
		})
		.map((x) => x[1].price!);
	$: minPrice = Math.min(...prices);
	$: maxPrice = Math.max(...prices);

	let dispatcher = createEventDispatcher();

	function dateValidation(date: Date): Date {
		let today = new Date();
		today.setHours(0, 0, 0, 0);
		let daysFromToday = differenceInDays(date, today);
		if (daysFromToday < 3) date = addDays(date, 3 - daysFromToday);
		return date;
	}

	function datesArray(current?: DateString): CalendarDate[] {
		if (!current) return [];
		let array: CalendarDate[] = [];
		let _current = dateValidation(new Date(current));

		for (let i = -3; i <= 3; i++) {
			let newDate = addDays(_current, i);
			array.push({
				date: format(newDate, 'yyyy-MM-dd') as DateString,
				dateFormatted: format(newDate, 'dd/MM/yyyy') as DateStringFormatted
			});
		}
		return array;
	}

	function parseDatepair(datepair: Datepair): [DateString, DateString] {
		let departure = datepair.substring(0, 10) as DateString;
		let _return = datepair.substring(11) as DateString;
		return [departure, _return];
	}

	async function newCalendar() {
		await tick();
		$fetchCalendar()
			.then((res) => ($calendar = res))
			.catch(() => dispatcher('error'));
	}

	async function newPrices(newDatepairs: Datepair[]) {
		await tick();
		$fetchNewPrices(newDatepairs)
			.then((newPrices) => ($calendar = { ...$calendar, ...newPrices }))
			.catch(() => dispatcher('error'));
	}

	/**
	 * Enables navigation in the calendar for scrolling through departure and return dates
	 * @param {CalendarScrollDirection} direction 1 to go forward -1 to go back
	 * @param {CalendarScrollType} type 'departures' for scrolling departure dates or 'returns' for scrolling return dates
	 */

	function scrollDate(direction: CalendarScrollDirection, type: CalendarScrollType) {
		let currentDate =
			type === 'departure' ? new Date($departureDates[3].date) : new Date($returnDates[3].date);
		let newCurrentDate = addDays(currentDate, direction);
		let newBorderDate = addDays(newCurrentDate, 3 * direction);

		if (type === 'departure' && direction === -1) {
			let today = new Date();
			today.setHours(0, 0, 0, 0);
			if (isAfter(today, newBorderDate)) return;
		} else if (type === 'departure' && direction === 1) {
			let firstReturnDate = new Date($returnDates[0].date);
			if (isAfter(newBorderDate, firstReturnDate)) return;
		} else if (type === 'return' && direction === -1) {
			let firstDepartureDate = new Date($departureDates[0].date);
			if (isBefore(newBorderDate, firstDepartureDate)) return;
		}

		let newDatesArray = datesArray(format(newCurrentDate, 'yyyy-MM-dd') as DateString);
		let newDatepairs: Datepair[] = [];
		if (type === 'departure') {
			$departureDates = newDatesArray;
			newDatepairs = $returnDates.map(
				(date) => `${format(newBorderDate, 'yyyy-MM-dd')}>${date.date}` as Datepair
			);
		} else if (type === 'return') {
			$returnDates = newDatesArray;
			newDatepairs = $departureDates.map(
				(date) => `${date.date}>${format(newBorderDate, 'yyyy-MM-dd')}` as Datepair
			);
		}
    newPrices(newDatepairs);
	}

	onMount(() => {
		//Set dynamic style properties
		let calendarWidth =
			document.querySelector<HTMLDivElement>('div.calendar-container')?.style.width;
		let departureDateControl = document.querySelector<HTMLDivElement>('div.departure-date-control');
		if (departureDateControl && calendarWidth) departureDateControl.style.width = calendarWidth;
	});
</script>

{#if calendarButtonVisible}
	<div class="control-panel d-flex justify-end">
		{#if calendarViewBtnVisible}
			<Button
				class="white-text"
				id="calendar-view-btn"
				on:click={() => {
					visible = true;
					calendarViewBtnVisible = false;
				}}
			>
				<Icon path={mdiCalendar} class="mr-3" />
				Calendar View
			</Button>
		{/if}
		{#if closeCalendarBtnVisible}
			<Button
				class="red white-text"
				id="calendar-close-btn"
				on:click={() => {
					visible = false;
					calendarViewBtnVisible = true;
				}}
			>
				<Icon size="15px" path={mdiClose} class="mr-3" />
				Close
			</Button>
		{/if}
	</div>
{/if}
{#if visible}
	<div class="main-container">
		<div class="departure-date-control arrow-controls">
			<div on:click={() => scrollDate(-1, 'departure')}>
				<Icon size="35px" path={mdiArrowLeftBold} />
			</div>
			<div on:click={() => scrollDate(1, 'departure')}>
				<Icon size="35px" path={mdiArrowRightBold} />
			</div>
		</div>
		<div style="display: flex; justify-content: space-between;">
			<div class="calendar-container">
				{#each $departureDates as departureDate, i}
					<DateCell topLeftCorner={i === 0}>{departureDate.dateFormatted}</DateCell>
					{#if i === 6}
						<DateCell topRightCorner />
					{/if}
				{/each}
				{#each $returnDates as returnDate, i}
					{#each $departureDates as departureDate, j}
						{@const price = $calendar[`${departureDate.date}>${returnDate.date}`]}
						<PriceCell
							cheap={price?.price === minPrice}
							expensive={price?.price === maxPrice}
							_departureDate={departureDate.date}
							_returnDate={returnDate.date}
							bottomLeftCorner={i === 6 && j === 0}
							{price}
						/>
					{/each}
					<DateCell bottomRightCorner={i === 6}>{returnDate.dateFormatted}</DateCell>
				{/each}
			</div>
			<div class="return-date-control arrow-controls">
				<div on:click={() => scrollDate(-1, 'return')}>
					<Icon size="35px" path={mdiArrowUpBold} />
				</div>
				<div on:click={() => scrollDate(1, 'return')}>
					<Icon size="35px" path={mdiArrowDownBold} />
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	:root {
		--calendar-background: rgb(0, 62, 121);
		--calendar-dates: rgb(0, 94, 184);
		--calendar-cheap: rgb(101, 206, 152);
		--calendar-expensive: rgb(213, 122, 161);
		--calendar-prices: rgb(155, 202, 236);
		--calendar-loading: rgb(202, 220, 233);
		--calendar-hover: rgb(184, 213, 233);
		--calendar-cheap-hover: rgb(143, 223, 181);
		--calendar-expensive-hover: rgb(231, 154, 188);
		--calendar-na: var(--calendar-loading);
		--arrows: rgb(0, 94, 184);
		--arrows-hover: rgb(0, 169, 224);
		--price-color: rgb(0, 53, 102);
		--cheap-price-color: rgb(0, 85, 41);
		--expensive-price-color: rgb(124, 0, 54);
		--cols: 8;
	}

	div.calendar-container {
		display: grid;
		grid-template-columns: repeat(var(--cols), auto);
		gap: 2px;
		padding: 5px;
		background-color: var(--calendar-background);
		width: 97%;
		overflow-x: auto;
		border-radius: 15px;
	}

	/*--------------------------------------*/

	div.arrow-controls {
		display: flex;
	}

	div.arrow-controls.departure-date-control {
		flex-direction: row;
		justify-content: space-between;
		width: 97%;
	}

	div.arrow-controls.return-date-control {
		flex-direction: column;
		justify-content: space-between;
	}

	div.arrow-controls :global(svg) {
		color: var(--arrows);
	}

	div.arrow-controls :global(svg:hover) {
		cursor: pointer;
		color: var(--arrows-hover);
	}
</style>
