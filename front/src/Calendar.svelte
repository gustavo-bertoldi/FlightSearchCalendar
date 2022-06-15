
<script>
  import { onMount, getContext, tick, createEventDispatcher } from 'svelte';
  import { format, addDays, isAfter, isBefore } from 'date-fns';
  import { ProgressCircular, Icon, Button } from 'svelte-materialify';
  import { mdiArrowLeftBold, mdiArrowRightBold, mdiArrowUpBold, mdiArrowDownBold, mdiCalendar, mdiClose } from '@mdi/js'

  const API_URL = getContext('API_URL');

  let dispatch = createEventDispatcher();
  let origin;
  let destination;
  let adults;
  let departureDate;
  let returnDate;
  let selectedDepartureDate;
  let selectedReturnDate;
  let travelClass;

  /**
   * Data used to build the calendar
   * @property {string[]} calendarData.departures Array with all departure dates current taken into account by the calendar (yyyy-MM-dd)
   * @property {string[]} calendarData.returns Array with all return dates current taken into account by the calendar (yyyy-MM-dd)
   * @property {object} calendarData.prices Map from datepairs in the format 'departure>arrival' to theirs prices
   * @property {number} calendarData.maxPrice Current maximum price in calendar shown datepairs
   * @property {number} calendarData.minPrice Current minimum price in calendar shown datepairs
   */
  let calendarData = {
    departures: [],
    returns: [],
    prices: {},
    maxPrice: 0,
    minPrice: Infinity
  };

  /**
   * Listens to the search event from the FlightSearch component to receive search parameters.
   * Initiates the calendar corresponding to a flight search
   * @param {object} data
   * @property {object} data.offers Offers object received from backend
   * @property {string} data.originCity 
   * @property {string} data.destinationCity 
   * @property {boolean} data.datesChange True if only dates changed for the request (calendar click)
   */
  export function flightSearchListener(data) {
    departureDate = new Date(data.departureDate);
    returnDate = new Date(data.returnDate);
    adults = data.adults;
    origin = data.origin;
    destination = data.destination;
    selectedDepartureDate = data.selectedDepartureDate;
    selectedReturnDate = data.selectedReturnDate;
    travelClass = data.travelClass;
    createFlightCalendar(data.flights);
  }

  /**
   * Resets calendar data and hide it. Used when a new search is fired
   */
  export function resetCalendar() {
    calendarData = {
      departures: [],
      returns: [],
      prices: {},
      maxPrice: 0,
      minPrice: Infinity
    };
    hideCalendar();
    hideCalendarButton();
  }

  /**
   * Enables navigation in the calendar for scrolling through departure and return dates
   * @param {number} direction 1 to go forward -1 to go back
   * @param {string} type 'departures' for scrolling departure dates or 'returns' for scrolling return dates
   */
  function scrollDate(direction, type) {
    let newDateIndex = direction == 1 ? 6 : 0;
    let newDate = addDays(new Date(calendarData[type][newDateIndex]), direction);

    if (type == 'departures' && direction == 1) {
      let firstRetDate = new Date(calendarData.returns[0]);
      if (isAfter(newDate, firstRetDate)) return;
    } else if (type == 'returns' && direction == -1) {
      let lastDepDate = new Date(calendarData.departures[6]);
      if (isBefore(newDate, lastDepDate)) return;
    } else if (direction == -1) {
      let today = new Date();
      if (isBefore(newDate, today)) return;
    }

    //Update calendar with new dates
    calendarData[type] = calendarData[type].map(date => 
      format(addDays(new Date(date), direction), 'yyyy-MM-dd'));

    //Create array with datepairs to search price
    let toCompleteArray = type == 'departures' ? calendarData.returns : calendarData.departures;
    let newDateFormatted = format(newDate, 'yyyy-MM-dd');
    let newDatepairs = toCompleteArray.map(date => 
      type == 'departures' ? `${newDateFormatted}>${date}` : `${date}>${newDateFormatted}`);
    fetchNewPrices(newDatepairs);
  }

  /**
   * Fetch prices corresponding to new datepairs after scrolling
   * @param {string[]} newDatepairs Datepairs in the format 'departure>return' (yyyy-MM-dd)
   */
  function fetchNewPrices(newDatepairs) {
    let datepairsFiltered = newDatepairs.filter(datepair => !calendarData.prices[datepair]);

    const url = `${API_URL}/flights-for-datepairs`;
    const data = {
      datepairs: datepairsFiltered,
      origin: origin,
      destination: destination,
      adults: adults,
      travelClass: travelClass 
    }
    const options = {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json; charset=UTF-8" }
    }
    const request = new Request(url, options);
    
    fetch(request)
      .then(response => response.json())
      .then(async flights => await addPricesToCalendar(flights))
      .catch(err => dispatch('error'));
  }

  /**
   * Add prices received in the flights object to the calendar
   * @param {object} flights Map of a datepair in the format 'departure>return' to an object containing the 
   * cheapest flight information for the datepair
   */
  async function addPricesToCalendar(flights) {
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
      } 
      else {
        calendarData.prices[datepair] = { price: `N/A`, priceFormatted: 'N/A' };
      }
    });
    await tick();
    calculateNewPriceBorders();
  }

  /**
   * Called by the flight search listener to build the calendar based on the data received by the backend
   * @param flights
   */
  function createFlightCalendar(flights) {
    let departures = [];
    let returns = [];

    //Adds to departure and return arrays dates corresponding to 3 days before the selected date
    //as well as 3 days after, resulting in a week-long view on both departure and return dates
    for (let i = -3; i <= 3; i++) {
      departures.push(format(addDays(departureDate, i), 'yyyy-MM-dd'));
      returns.push(format(addDays(returnDate, i), 'yyyy-MM-dd'));
    }
    calendarData.departures = departures;
    calendarData.returns = returns;
    addPricesToCalendar(flights);
  }

  /**
   * Recalculates new maximum and minimum prices based on flights received for the new datepairs
   */
  function calculateNewPriceBorders() {
    let prices = {};
    document.querySelectorAll('div.calendar-price:not(.na-price):not(.loading) > span').forEach((element) => {
      let price = element.dataset.price;
      if (prices[price]) prices[price].push(element);
      else prices[price] = [element];
    });
    let max = Math.max(...Object.keys(prices));
    let min = Math.min(...Object.keys(prices));
    calendarData.minPrice = min.toFixed(2);
    if (max != min) calendarData.maxPrice = max.toFixed(2);
  }

  /**
   * Helper function to show the calendar, its close button and hide the view calendar button
   */
  export function showCalendar() {
    document.querySelector('div.main-container').style.display = 'block';
    document.getElementById('calendar-view-btn').style.display = 'none';
    document.getElementById('calendar-close-btn').style.display = 'block'
  }

  /**
   * Helper function to hide the calendar and its close button, shows the view calendar button
   */
  export function hideCalendar() {
    document.querySelector('div.main-container').style.display = 'none';
    document.getElementById('calendar-view-btn').style.display = 'block';
    document.getElementById('calendar-close-btn').style.display = 'none'
  }

  /**
   * Helper function called when the flight offers are received. Shows the calendar view button
   */
  export function showCalendarButton() {
    document.getElementById('calendar-view-btn').style.display = 'block';
  }

  /**
   * Helper function to hide calendar view button
   */
  export function hideCalendarButton() {
    document.getElementById('calendar-view-btn').style.display = 'none';
  }

  /**
   * Manages the click event on a datepair in the calendar. Fires a new search for the new datepair
   * and recenters the calendar to the chosen date.
   * @param {Event} event Click event captured by the element. Allow to retrieve the element's data
   */
  function dateClicked(event) {
    let depDate = event.currentTarget.dataset.departure;
    let retDate = event.currentTarget.dataset.return;
    selectedDepartureDate = depDate;
    selectedReturnDate = retDate;

    //relX and relY are the relative positions of the clicked data to the original selected data
    let relX = event.currentTarget.dataset.relx;
    let relY = event.currentTarget.dataset.rely;
    if (!(relX === 0 && relY === 0)) {
      dispatch('dateClicked', {depDate: depDate, retDate: retDate});

      let directionX = relX < 0 ? -1 : 1;
      let directionY = relY < 0 ? -1 : 1;

      for (let i = 0; i < Math.abs(relX); i++) {
          scrollDate(directionX, 'departures');
      }

      for (let i = 0; i < Math.abs(relY); i++) {
          scrollDate(directionY, 'returns');
      }
    }
  }

  onMount(() => {
    //Set dynamic style properties
    let calendarWidth = document.querySelector('div.calendar-container').style.width;
    document.querySelector('div.departure-date-control').style.width = calendarWidth;
  });
  
</script>
<div class="control-panel d-flex justify-end">
  <Button class="white-text" id="calendar-view-btn" on:click={showCalendar} style="display: none;"><Icon path={mdiCalendar} class="mr-3" />Calendar View</Button>
  <Button class="red white-text" id="calendar-close-btn" on:click={hideCalendar} style="display: none;"><Icon size="15px" path={mdiClose} class="mr-3" />Close</Button>
</div>
<div class="main-container">
  <div class="departure-date-control arrow-controls">
    <div on:click={() => scrollDate(-1, 'departures')}><Icon size="35px" path={mdiArrowLeftBold}/></div>
    <div on:click={() => scrollDate(1, 'departures')}><Icon size="35px" path={mdiArrowRightBold}/></div>
  </div>
  <div style="display: flex; justify-content: space-between;">
    <div class="calendar-container" style="--cols: 8">
      {#each Array(8) as _, i}
        {#each Array(8) as _, j}
          {#if (i == 0 || j == 7)}
            {@const depDate = calendarData.departures[j] ? format(new Date(calendarData.departures[j]), 'dd/MM/yyyy') : ''}
            {@const retDate = calendarData.returns[i - 1] ? format(new Date(calendarData.returns[i - 1]), 'dd/MM/yyyy') : ''}
            {@const date = (i == 0 && j != 7) ? depDate : retDate || ''}
            {@const classes = `calendar-item calendar-date`
                            + `${(i == 0 && j != 7) ? ' departure-date' : ''}`
                            + `${(i != 0 && j == 7) ? ' return-date' : ''}`
                            + `${(i == 0 && j == 7) ? ' top-right-corner' : ''}`
                            + `${(i == 0 && j == 0) ? ' top-left-corner' : ''}`
                            + `${(i == 7 && j == 7) ? ' bottom-right-corner' : ''}`
            }
            <div class={classes}>
              <span class="calendar-item-text">{date}</span>
            </div>
          {:else}
            {@const datepair = calendarData.departures[j] + '>' + calendarData.returns[i - 1]}
            {@const priceObj = calendarData.prices[datepair] ? calendarData.prices[datepair] : {}}
            {@const classes = `calendar-item calendar-price`
                            + `${priceObj.price == calendarData.minPrice ? ' cheapest' : ''}`
                            + `${priceObj.price == calendarData.maxPrice ? ' expensive' : ''}`
                            + `${priceObj.priceFormatted == 'N/A' ? ' na-price' : ''}`
                            + `${Object.keys(priceObj).length === 0 ? ' loading' : ''}`
                            + `${(i == 7 && j == 0) ? ' bottom-left-corner' : ''}`
                            + `${(selectedDepartureDate && selectedDepartureDate == calendarData.departures[j] && selectedReturnDate == calendarData.returns[i - 1]) ? ' selected-dates' : ''}`
            }
            {@const relY = i - 4}
            {@const relX = j - 3}
            <div class={classes} data-departure={calendarData.departures[j]} data-return={calendarData.returns[i - 1]} data-relx={relX} data-rely={relY} on:click={(e) => dateClicked(e)}>
              {#if priceObj.price}
                <span class="calendar-item-text" data-price={priceObj.price}>{priceObj.priceFormatted}</span>
              {:else}
                <ProgressCircular indeterminate color="rgb(0,94,184)"/>
              {/if}
            </div>
          {/if}
        {/each}
      {/each}
    </div>
    <div class="return-date-control arrow-controls">
      <div on:click={() => scrollDate(-1, 'returns')}><Icon size="35px" path={mdiArrowUpBold}/></div>
      <div on:click={() => scrollDate(1, 'returns')}><Icon size="35px" path={mdiArrowDownBold}/></div>
    </div>
  </div>
</div>


<style>
  :root {
    --calendar-background: rgb(0, 62, 121);
    --calendar-dates: rgb(0,94,184);
    --calendar-cheap: rgb(101, 206, 152);
    --calendar-expensive: rgb(213, 122, 161);
    --calendar-prices: rgb(155,202,236);
    --calendar-loading: rgb(202, 220, 233);
    --calendar-hover: rgb(184, 213, 233);
    --calendar-cheap-hover: rgb(143, 223, 181);
    --calendar-expensive-hover: rgb(231, 154, 188);;
    --calendar-na: var(--calendar-loading);
    --arrows: rgb(0,94,184);
    --arrows-hover: rgb(0,169,224);
    --price-color: rgb(0, 53, 102);
    --cheap-price-color: rgb(0, 85, 41);
    --expensive-price-color: rgb(124, 0, 54);
  }
  
  div.main-container {
    display: none;
  }

  div.calendar-container {
    display: grid;
    grid-template-columns: repeat(var(--cols) ,auto);
    gap: 2px;
    padding: 5px;
    background-color: var(--calendar-background);
    width: 97%;
    overflow-x: auto;
    border-radius: 15px;
  }

  div.calendar-item {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 50px;
  }

  div.calendar-item.calendar-date {
    background-color: var(--calendar-dates);
  }

  div.calendar-item.calendar-price {
    background-color: var(--calendar-prices);
  }

  div.calendar-item.calendar-price:hover {
    cursor: pointer;
    background-color: var(--calendar-hover);
  }

  div.calendar-item.calendar-price.loading {
    background-color: var(--calendar-loading);
    pointer-events: none;
  }

  div.calendar-item.calendar-price.loading:hover {
    cursor: default;
    background-color: var(--calendar-loading);
  }

  div.calendar-item.calendar-price.cheapest {
    background-color: var(--calendar-cheap);
  }

  div.calendar-item.calendar-price.cheapest:hover {
    background-color: var(--calendar-cheap-hover);
  }

  div.calendar-item.calendar-price.expensive {
    background-color: var(--calendar-expensive);
  }

  div.calendar-item.calendar-price.expensive:hover {
    background-color: var(--calendar-expensive-hover);
  }

  div.calendar-item:global(.na-price) {
    background-color: var(--calendar-na);
    pointer-events: none;
  }

  div.calendar-item.calendar-price:global(.na-price:hover) {
    cursor: default;
    background-color: var(--calendar-na);
  }

  div.calendar-item.calendar-price > span {
    font-weight: 500;
    color: var(--price-color);
    padding: 5px;
  }

  div.calendar-item.calendar-price.cheapest > span {
    color: var(--cheap-price-color);
  }

  div.calendar-item.calendar-price.expensive > span {
    color: var(--expensive-price-color);
  }

  div.calendar-item.calendar-date > span {
    font-weight: 500;
    padding: 5px;
    color: white;
  }

  div.calendar-item.calendar-price:hover {
    cursor: pointer;
    background-color: var(--calendar-hover);
  }

  div.calendar-item.calendar-price.selected-dates {
    box-shadow: inset 0px 0px 18px 5px var(--calendar-dates);
    pointer-events: none;
  }

  div.calendar-item.calendar-price.expensive.selected-dates {
    box-shadow: inset 0px 0px 18px 5px var(--expensive-price-color);
  }

  div.calendar-item.calendar-price.cheapest.selected-dates {
    box-shadow: inset 0px 0px 18px 5px var(--cheap-price-color);
  }


  /*Define rounded corners on corner cells*/
  /*--------------------------------------*/
  
  div.top-left-corner {
    border-top-left-radius: 10px;
  }

  div.top-right-corner {
    border-top-right-radius: 10px;
    background-color: var(--calendar-dates);
  }

  div.bottom-left-corner {
    border-bottom-left-radius: 10px;
  }

  div.bottom-right-corner {
    border-bottom-right-radius: 10px;
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

