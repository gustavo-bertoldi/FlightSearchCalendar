<script lang="ts">
	import { onMount, tick, createEventDispatcher } from 'svelte';
	import { format, addDays, isAfter, isBefore } from 'date-fns';
	import { ProgressCircular, Icon, Button } from 'svelte-materialify';
	import { mdiArrowLeftBold, mdiArrowRightBold, mdiArrowUpBold, mdiArrowDownBold, mdiCalendar, mdiClose, mdiAccessPoint } from '@mdi/js';
	import type { CalendarDate, CalendarPrice, CalendarPrices, CalendarScrollDirection, CalendarScrollType, Datepair, DateString, DateStringFormatted } from '$types/calendar';
  import { CONSTANTS } from '$stores/constants';
  import { calendarData } from '$stores/calendar-data';
  import PriceCell from './Calendar/PriceCell.svelte';
  import DateCell from './Calendar/DateCell.svelte';
  import { departureDate, returnDate, origin, destination, adults, flightClass } from '$stores/flight-info';
  import DateField from './SearchForm/DateField.svelte';

  let visible: boolean = true;

  let calendar: CalendarPrices;
  calendarData.subscribe(newData => {
    calendar = newData.reduce<CalendarPrices>((acc, cur) => {
      cur.returns.forEach(ret => {
        acc[`${cur.date}>${ret.date}`] = {price: ret.price, priceFormatted: ret.priceFormatted};
      });
      return acc;
    }, {});
  });

  let currentDepartureDate = $departureDate as DateString;
  let currentReturnDate = $returnDate as DateString;
  let currentDepartureDates: CalendarDate[];
  let currentReturnDates: CalendarDate[];
  departureDate.subscribe(value => {
    currentDepartureDate = value as DateString;
    currentDepartureDates = datesArray(value as DateString);
  });
  returnDate.subscribe(value => {
    currentReturnDate = value as DateString;
    currentReturnDates = datesArray(value as DateString);
  });

  $: currentPrices = Object.entries(calendar).filter(x => {
      let [departure, _return] = parseDatepair(x[0] as Datepair);
      return (x[1].price 
        && currentDepartureDates.filter(x => x.date === departure).length > 0
        && currentReturnDates.filter(x => x.date === _return).length > 0);
    }).map(x => x[1].price!);
  $: minPrice = Math.min(...currentPrices);
  $: maxPrice = Math.max(...currentPrices);


  let dispatcher = createEventDispatcher();

  function datesArray(current?: DateString): CalendarDate[] {
    if (!current) return [];
    let array: CalendarDate[] = [];
    for (let i = -3; i <= 3; i++) {
      let newDate = addDays(new Date(current), i);
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

	/**
	 * Listens to the search event from the FlightSearch component to receive search parameters.
	 * Initiates the calendar corresponding to a flight search
	 * @param {object} data
	 * @property {object} data.offers Offers object received from backend
	 * @property {string} data.originCity
	 * @property {string} data.destinationCity
	 * @property {boolean} data.datesChange True if only dates changed for the request (calendar click)
	 */
  /*
	export function flightSearchListener(data: any) {
		departureDate = new Date(data.departureDate);
		returnDate = new Date(data.returnDate);
		adults = data.adults;
		origin = data.origin;
		destination = data.destination;
		selectedDepartureDate = data.selectedDepartureDate;
		selectedReturnDate = data.selectedReturnDate;
		travelClass = data.travelClass;
		createFlightCalendar(data.flights);
	}*/

	/**
	 * Resets calendar data and hide it. Used when a new search is fired
	 */
	export function resetCalendar() {
		calendarData.set([]);
		hideCalendar();
		hideCalendarButton();
	}

	/**
	 * Enables navigation in the calendar for scrolling through departure and return dates
	 * @param {CalendarScrollDirection} direction 1 to go forward -1 to go back
	 * @param {CalendarScrollType} type 'departures' for scrolling departure dates or 'returns' for scrolling return dates
	 */

	function scrollDate(direction: CalendarScrollDirection, type: CalendarScrollType) {    
		let currentDate = type === 'departure' ? new Date(currentDepartureDate) : new Date(currentReturnDate);
		let newCurrentDate = addDays(currentDate, direction);
    let newBorderDate = addDays(newCurrentDate, 3*direction);

		if (type == 'departure' && direction == 1) {
			let firstRetDate = addDays(currentDate, -3);
			if (isAfter(newBorderDate, firstRetDate)) return;
		} else if (type == 'return' && direction == -1) {
			let lastDepDate = addDays(currentDate, 3);
			if (isBefore(newBorderDate, lastDepDate)) return;
		} else if (direction == -1) {
			let today = new Date();
			if (isBefore(newBorderDate, today)) return;
		}

    //Update current date
    let newDatepairs: Datepair[];
    let newCurrentDateFormatted = format(newCurrentDate, 'yyyy-MM-dd') as DateString;
    let newBorderDateFormatted = format(newBorderDate, 'yyyy-MM-dd') as DateString;
    if (type === 'departure') {
      currentDepartureDate = newCurrentDateFormatted;
      currentDepartureDates = datesArray(currentDepartureDate);
      newDatepairs = currentReturnDates.map<Datepair>(x => `${newBorderDateFormatted}>${x.date}`);
    }
    else {
      currentReturnDate = newCurrentDateFormatted;
      currentReturnDates = datesArray(currentReturnDate);
      newDatepairs = currentDepartureDates.map<Datepair>(x => `${x.date}>${newBorderDateFormatted}`);
    }

    //Remove prices already fetched
    console.log(newDatepairs)
    newDatepairs = newDatepairs.filter(x => !calendar.hasOwnProperty(x));
		if (newDatepairs.length > 0) fetchNewPrices(newDatepairs);
       
	}

	/**
	 * Fetch prices corresponding to new datepairs after scrolling
	 * @param {string[]} newDatepairs Datepairs in the format 'departure>return' (yyyy-MM-dd)
	 */
  
	function fetchNewPrices(newDatepairs: Datepair[]) {
		const url = `${$CONSTANTS.API_URL}/flights-for-datepairs`;
		const data = {
			datepairs: newDatepairs,
			origin: $origin,
			destination: $destination,
			adults: $adults,
			travelClass: $flightClass
		};
		const options = {
			method: 'POST',
			body: JSON.stringify(data),
			headers: { 'Content-Type': 'application/json; charset=UTF-8' }
		};
		const request = new Request(url, options);

		fetch(request)
			.then((response) => response.json())
			.then((prices: CalendarPrices) => {
        Object.keys(prices).forEach(datepair => {
          calendar[datepair as Datepair] = prices[datepair as Datepair];
        })
      })
			.catch((err) => dispatcher('error'));
	}
  

	/**
	 * Add prices received in the flights object to the calendar
	 * @param {object} flights Map of a datepair in the format 'departure>return' to an object containing the
	 * cheapest flight information for the datepair
	 */
  /*
	async function addPricesToCalendar(flights: any) {
		Object.keys(flights).forEach((datepair) => {
			if (flights[datepair] != 'error') {
				let finalPrice = flights[datepair][0].price.total;
				let currency = flights[datepair][0].price.currency;
				let currencyFormatter = Intl.NumberFormat('en-US', {
					style: 'currency',
					currency: currency
				});
				calendarData.prices[datepair] = {
					priceFormatted: currencyFormatter.format(finalPrice),
					price: finalPrice
				};
			} else {
				calendarData.prices[datepair] = { price: `N/A`, priceFormatted: 'N/A' };
			}
		});
		await tick();
		calculateNewPriceBorders();
	}*/

	/**
	 * Called by the flight search listener to build the calendar based on the data received by the backend
	 * @param flights
	 */
  /*
	function createFlightCalendar(flights: any) {
		let departures: string[] = [];
		let returns: string[] = [];

		//Adds to departure and return arrays dates corresponding to 3 days before the selected date
		//as well as 3 days after, resulting in a week-long view on both departure and return dates
		for (let i = -3; i <= 3; i++) {
			departures.push(format(addDays(departureDate, i), 'yyyy-MM-dd'));
			returns.push(format(addDays(returnDate, i), 'yyyy-MM-dd'));
		}
		calendarData.departures = departures;
		calendarData.returns = returns;
		addPricesToCalendar(flights);
	}*/

	/**
	 * Recalculates new maximum and minimum prices based on flights received for the new datepairs
	 */
  /*
	function calculateNewPriceBorders() {
		let prices: { [index: string]: HTMLSpanElement[] } = {};
		document
			.querySelectorAll<HTMLSpanElement>('div.calendar-price:not(.na-price):not(.loading) > span')
			.forEach((element) => {
				let price = element.dataset.price;
				if (!price) return;
				if (prices[price]) prices[price].push(element);
				else prices[price] = [element];
			});

		let allPrices = Object.keys(prices).map((str) => parseFloat(str));
		let max = Math.max(...allPrices);
		let min = Math.min(...allPrices);
		calendarData.minPrice = Math.round((min + Number.EPSILON) * 100) / 100;
		if (max != min) calendarData.maxPrice = Math.round((max + Number.EPSILON) * 100) / 100;
	}*/

	/**
	 * Helper function to show the calendar, its close button and hide the view calendar button
	 */
	export function showCalendar() {
		let mainContainer = document.querySelector<HTMLDivElement>('div.main-container');
		let calendarViewBtn = document.querySelector<HTMLButtonElement>('#calendar-view-btn');
		let calendarCloseBtn = document.querySelector<HTMLButtonElement>('#calendar-close-btn');

		if (mainContainer) mainContainer.style.display = 'block';
		if (calendarViewBtn) calendarViewBtn.style.display = 'none';
		if (calendarCloseBtn) calendarCloseBtn.style.display = 'block';
	}

	/**
	 * Helper function to hide the calendar and its close button, shows the view calendar button
	 */
	export function hideCalendar() {
		let mainContainer = document.querySelector<HTMLDivElement>('div.main-container');
		let calendarViewBtn = document.querySelector<HTMLButtonElement>('#calendar-view-btn');
		let calendarCloseBtn = document.querySelector<HTMLButtonElement>('#calendar-close-btn');

		if (mainContainer) mainContainer.style.display = 'none';
		if (calendarViewBtn) calendarViewBtn.style.display = 'block';
		if (calendarCloseBtn) calendarCloseBtn.style.display = 'none';
	}

	/**
	 * Helper function called when the flight offers are received. Shows the calendar view button
	 */
	export function showCalendarButton() {
		let calendarViewBtn = document.querySelector<HTMLButtonElement>('#calendar-view-btn');
		if (calendarViewBtn) calendarViewBtn.style.display = 'block';
	}

	/**
	 * Helper function to hide calendar view button
	 */
	export function hideCalendarButton() {
		let calendarViewBtn = document.querySelector<HTMLButtonElement>('#calendar-view-btn');
		if (calendarViewBtn) calendarViewBtn.style.display = 'none';
	}

	/**
	 * Manages the click event on a datepair in the calendar. Fires a new search for the new datepair
	 * and recenters the calendar to the chosen date.
	 * @param {Event} event Click event captured by the element. Allow to retrieve the element's data
	 */
  /*
	function dateClicked(event: Event) {
		let eventTarget = event.currentTarget;
		let depDate;
		let retDate;
		if (eventTarget instanceof HTMLDivElement) {
			depDate = eventTarget.dataset.departure;
			retDate = eventTarget.dataset.return;
			if (depDate && retDate) {
				selectedDepartureDate = depDate;
				selectedReturnDate = retDate;
			} else return;

			//relX and relY are the relative positions of the clicked data to the original selected data
			let relX;
      let relY;
      if (eventTarget.dataset.relx !== undefined) relX = parseInt(eventTarget.dataset.relx);
      else return;
      if (eventTarget.dataset.rely !== undefined) relY = parseInt(eventTarget.dataset.rely);
      else return;

			if (!(relX === 0 && relY === 0)) {
				dispatch('dateClicked', { depDate: depDate, retDate: retDate });

				let directionX: CalendarScrollDirection = relX < 0 ? -1 : 1;
				let directionY: CalendarScrollDirection = relY < 0 ? -1 : 1;

				for (let i = 0; i < Math.abs(relX); i++) {
					scrollDate(directionX, 'departures');
				}

				for (let i = 0; i < Math.abs(relY); i++) {
					scrollDate(directionY, 'returns');
				}
			}
		} else return;
	}*/

	onMount(() => {
		//Set dynamic style properties
		let calendarWidth = document.querySelector<HTMLDivElement>('div.calendar-container')?.style.width;
    let departureDateControl = document.querySelector<HTMLDivElement>('div.departure-date-control');
		if (departureDateControl && calendarWidth) departureDateControl.style.width = calendarWidth;
	});
</script>

<div class="control-panel d-flex justify-end">
	<Button class="white-text" id="calendar-view-btn" on:click={showCalendar}>
    <Icon path={mdiCalendar} class="mr-3" />Calendar View</Button>
	<Button
		class="red white-text"
		id="calendar-close-btn"
		on:click={hideCalendar}
		style="display: none;"><Icon size="15px" path={mdiClose} class="mr-3" />Close</Button
	>
</div>
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
      {#each currentDepartureDates as departureDate, i}
        <DateCell topLeftCorner={i === 0}>{departureDate.dateFormatted}</DateCell>
        {#if i === 6}
          <DateCell topRightCorner></DateCell>
        {/if}
      {/each}
      {#each currentReturnDates as returnDate, i}
        {#each currentDepartureDates as departureDate, j}
          {@const price = calendar[`${departureDate.date}>${returnDate.date}`]}
          <PriceCell
            cheap={price?.price === minPrice}
            expensive={price?.price === maxPrice}
            departureDate={departureDate.date}
            returnDate={returnDate.date}
            relX={j - 3}
            relY={i - 3}
            naPrice={!price?.priceFormatted}
            loading={!price}
            
          >
            {price?.priceFormatted || 'N/A'}
          </PriceCell>
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
    --cols: 8
	}

	div.main-container {
		display: none;
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
