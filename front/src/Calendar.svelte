
<script>
  import { onMount, getContext, tick } from 'svelte';
  import { format, addDays, isAfter, isBefore } from 'date-fns';
  import { ProgressCircular, ProgressLinear, Icon } from 'svelte-materialify';
  import { mdiArrowLeftBold, mdiArrowRightBold, mdiArrowUpBold, mdiArrowDownBold } from '@mdi/js'

  const API_URL = getContext('API_URL');

  let origin;
  let destination;
  let adults;
  let departureDate;
  let returnDate;
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
   */
  export function flightSearchListener(data) {
    departureDate = new Date(data.departureDate);
    returnDate = new Date(data.returnDate);
    adults = data.adults;
    origin = data.origin;
    destination = data.destination;
    calendarData = {
      departures: [],
      returns: [],
      prices: {},
      maxPrice: 0,
      minPrice: Infinity
    };
    createFlightCalendar(data.flights);
    document.querySelector('div.main-container').style.display = 'block';
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
   * @param newDatepairs
   */
  function fetchNewPrices(newDatepairs) {
    let datepairsFiltered = newDatepairs.filter(datepair => !calendarData.prices[datepair]);

    const url = `${API_URL}/flights-for-datepairs`;
    const data = {
      datepairs: datepairsFiltered,
      origin: origin,
      destination: destination,
      adults: adults
    }
    const options = {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json; charset=UTF-8" }
    }
    const request = new Request(url, options);
    
    fetch(request)
      .then(response => response.json())
      .then(async flights => await addPricesToCalendar(flights));
  }

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

  function createFlightCalendar(flights) {
    let departures = [];
    let returns = [];

    for (let i = -3; i <= 3; i++) {
      departures.push(format(addDays(departureDate, i), 'yyyy-MM-dd'));
      returns.push(format(addDays(returnDate, i), 'yyyy-MM-dd'));
    }
    calendarData.departures = departures;
    calendarData.returns = returns;
    addPricesToCalendar(flights);
  }

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

  onMount(() => {
    //Set dynamic style properties
    let calendarWidth = document.querySelector('div.calendar-container').style.width;
    document.querySelector('div.departure-date-control').style.width = calendarWidth;
    //createCalendar(new Date(2022,7,10), new Date(2022,7,20));
  });
  
</script>
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
            }
            <div class={classes}>
              {#if priceObj.price}
                <span class="calendar-item-text" data-price={priceObj.price}>{priceObj.priceFormatted}</span>
              {:else}
                <ProgressCircular indeterminate color="rgb(22, 84, 135)"/>
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
    --calendar-background: #165487;
    --calendar-dates: #3d86cf;
    --calendar-cheap: #dcebcb;
    --calendar-expensive: #ffcdd2;
    --calendar-prices: #d5e7ef;
    --calendar-loading: #efefed;
    --calendar-hover: #dfecf8;
    --calendar-cheap-hover: #dfe4d9;
    --calendar-expensive-hover: #fbdcdf;
    --calendar-na: var(--calendar-loading);
    --arrows-hover: rgb(0, 98, 128);
    --price-color: #165487;
    --cheap-price-color: #19480f;
    --expensive-price-color: #b61827;
  }

  @font-face {
    font-family: 'Nunito';
    font-style: normal;
    font-weight: 700;
    src: "https://fonts.googleapis.com/css?family=Nunito";
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
  }

  div.calendar-item.calendar-price:global(.na-price:hover) {
    cursor: default;
    background-color: var(--calendar-na);
  }

  div.calendar-item.calendar-price > span {
    font-weight: 700;
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
    font-weight: 700;
    padding: 5px;
    color: white;
  }

  div.calendar-item.calendar-price:hover {
    cursor: pointer;
    background-color: var(--calendar-hover);
  }

  span.calendar-item-text {
    font-family: 'Nunito', sans-serif;
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
    color: var(--calendar-background);
  }

  div.arrow-controls :global(svg:hover) {
    cursor: pointer;
    color: var(--arrows-hover);
  }

</style>

