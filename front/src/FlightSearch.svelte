<script>
  import { onMount, createEventDispatcher, getContext } from 'svelte';
  import { TextField, Button, MaterialApp, Row, Col, ProgressCircular, Icon } from 'svelte-materialify';
  import { addDays, format, isAfter, isBefore, isEqual, isSameDay } from 'date-fns';

  const API_URL = getContext('API_URL');
  const dispatch = createEventDispatcher();

  //Autocomplete
  let originTimeout;
  let destinationTimeout;
  const timeoutInterval = 500;
  let airports = {
    origin: [],
    destination: []
  }

  const originRules = [
    (v) => !!v || 'Please enter the origin city or airport'
  ]
  const destinationRules = [
    (v) => !!v || 'Please enter the destination city or airport'
  ]
  const departureDateRules = [
    (v) => !!v || 'Please enter the date of departure'
  ]
  const returnDateRules = [
    (v) => !!v || 'Please enter the date of return'
  ]
  const adultsRules = [
    (v) => !!v || 'Please enter number of adults'
  ]

  function dateVerification(date) {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const dayAfterTomorrow = addDays(today, 2);

    if (isSameDay(date, today)) {
      date = addDays(date, 3);
    } else if (isSameDay(date, tomorrow)) {
      date = addDays(date, 2);
    } else if (isSameDay(date, dayAfterTomorrow)) {
      date = addDays(date, 1);
    }

    return date;
  }

  function flightSearch() {
    //Show loading on button
    document.getElementById('loader-container').style.display = 'flex';
    document.getElementById('search-flights-btn').style.display = 'none';

    let departureDate = new Date(document.getElementById('fs-flight-departure-date').value);
    let returnDate = new Date(document.getElementById('fs-flight-return-date').value);
    departureDate = dateVerification(departureDate);
    returnDate = dateVerification(returnDate);

    const origin = document.getElementById("fs-flight-origin").value;
    const destination = document.getElementById("fs-flight-destination").value;
    const departureDateFormatted = format(departureDate, 'yyyy-MM-dd');
    const returnDateFormatted = format(returnDate, 'yyyy-MM-dd');
    const adults = document.getElementById("fs-adults").value || 1;
    const apiURL = `${API_URL}/calendar-view`
                    +  `?origin=${origin}`
                    +  `&destination=${destination}`
                    +  `&departureDate=${departureDateFormatted}`
                    +  `&returnDate=${returnDateFormatted}`
                    +  `&adults=${adults}`;

    const request = new Request(apiURL, { method: 'GET' });
    fetch(request)
      .then(response => response.json())
      .then(flights => {
        dispatch('flightsReady', {
          flights: flights,
          departureDate: departureDateFormatted,
          returnDate: returnDateFormatted,
          origin: origin,
          destination: destination,
          adults: adults
        });
        //Hide loading on button
        document.getElementById('loader-container').style.display = 'none';
        document.getElementById('search-flights-btn').style.display = 'block';
      });
  }

  function departureDateSelected() {
    let dateSelected = document.getElementById('fs-flight-departure-date')?.value;
    let returnDate = document.getElementById('fs-flight-return-date')?.value;

    if (dateSelected) {
      document.getElementById('fs-flight-return-date').setAttribute('min', dateSelected);
      if (returnDate && isAfter(new Date(dateSelected), new Date(returnDate))) {
        document.getElementById('fs-flight-return-date').value = dateSelected;
      }
    }
  }



  function searchSuggestion(keyword, input) {
    document.getElementById(`${input}-autocomplete-load`).style.display = 'block';
    const apiURL = `${API_URL}/search-suggestions?keyword=${keyword}`;
    const request = new Request(apiURL, { method: 'GET' });
    fetch(request)
      .then(response => response.json())
      .then(suggestions => {
        airports[input] = [];
        suggestions.data.forEach(airport => {
          airports[input].push({
            iataCode: airport.iataCode,
            name: airport.name
          });
        });
        document.getElementById(`${input}-autocomplete-load`).style.display = 'none';
      });
  }

  function autocompleteSelected(input, event) {
    document.getElementById(`fs-flight-${input}`).value = event.target.getAttribute('itemLabel')
  }

  onMount(() => {
    //Flight origin autocomplete event listeners
    document.getElementById('fs-flight-origin').addEventListener('focus', () => {
      document.getElementById('origin-items-list').style.display = 'block'
    });
    document.getElementById('fs-flight-origin').addEventListener('focusout', () => {
      setTimeout(() => {
        document.getElementById('origin-items-list').style.display = 'none'
      }, 100)
    });
    document.getElementById('fs-flight-origin').addEventListener('input', function() {
      clearTimeout(originTimeout);
      originTimeout = setTimeout(() => searchSuggestion(this.value, 'origin'), timeoutInterval);    
    });

    //Flight destination event listeners
    document.getElementById('fs-flight-destination').addEventListener('focus', () => {
      document.getElementById('destination-items-list').style.display = 'block'
    });
    document.getElementById('fs-flight-destination').addEventListener('focusout', () => {
      setTimeout(() => {
        document.getElementById('destination-items-list').style.display = 'none'
      }, 100)
    });
    document.getElementById('fs-flight-destination').addEventListener('input', function() {
      clearTimeout(destinationTimeout);
      destinationTimeout = setTimeout(() => searchSuggestion(this.value, 'destination'), timeoutInterval);    
    });
  });

  
</script>


<MaterialApp>
  <Row class="d-flex justify-center">
    <Col cols={12} sm={12} lg={3}>
      <form autocomplete="off">
        <div class="autocomplete-origin">
          <TextField id="fs-flight-origin" class="fs-text-field" color="#165487" value="NCE" rules={originRules}>
            <div slot="append" id="origin-autocomplete-load">
              <Icon>
                <ProgressCircular indeterminate color="#165487"/>
              </Icon>
            </div>
            Flight origin
          </TextField>
        </div>
		      <ul class="autocomplete-list" id="origin-items-list">
			      {#each airports.origin as airport, _}
				      <li itemLabel={airport.iataCode} on:click|preventDefault|stopPropagation={(e) => autocompleteSelected('origin', e)}><strong>{airport.iataCode}</strong>  {airport.name}</li>
			      {/each}			
		      </ul>
      </form>
    </Col>
    <Col cols={12} sm={12} lg={3}>
      <form autocomplete="off">
        <div class="autocomplete-destination">
          <TextField id="fs-flight-destination" class="fs-text-field" color="#165487" value="ORY" rules={destinationRules}>
            <div slot="append" id="destination-autocomplete-load">
              <Icon>
                <ProgressCircular indeterminate color="#165487"/>
              </Icon>
            </div>
            Flight destination
          </TextField>
        </div>
		      <ul class="autocomplete-list" id="destination-items-list">
			      {#each airports.destination as airport, _}
				      <li itemLabel={airport.iataCode}  on:click|preventDefault|stopPropagation={(e) => autocompleteSelected('destination', e)}><strong>{airport.iataCode}</strong>  {airport.name}</li>
			      {/each}			
		      </ul>
      </form>
    </Col>
    <Col cols={5} sm={5} lg={2}><TextField id="fs-flight-departure-date" class="fs-text-field" color="#165487" type="date" value="2022-08-01" min={format(new Date(), 'yyyy-MM-dd')} on:change={departureDateSelected} rules={departureDateRules}>Departure</TextField></Col>
    <Col cols={5} sm={5} lg={2}><TextField id="fs-flight-return-date" class="fs-text-field" color="#165487" type="date" value="2022-08-20" rules={returnDateRules}>Return</TextField></Col>
    <Col cols={2} sm={2} lg={1}><TextField id="fs-adults" class="fs-text-field" type="number" color="#165487" value="1" rules={adultsRules}>Adults</TextField></Col>
    <Col cols={12} sm={12} lg={12} class="d-flex justify-center"><Button class="blue white-text" id="search-flights-btn" color="#165487" on:click={flightSearch}>Search</Button></Col>
  </Row>
  <div class="d-flex justify-center" id="loader-container" style="display: none">
    <ProgressCircular indeterminate color="rgb(22, 84, 135)"/>
  </div>

  
</MaterialApp>

<style>
  :root {
    --autocomplete-hover: #d9dfe6;
  }

  :global(#search-flights-btn) {
    background-color: rgb(22, 84, 135) !important;
  }

  :global(ul.autocomplete-list) {
    position: relative;
	  margin: 0;
	  top: 0;
    width: 100%;
    padding: 0 3px 0 0;
	  background-color: #fff;
    list-style: none;
    max-height: 200px;
    overflow-y: auto;
    display: none;
  }

  :global(ul.autocomplete-list > li) {
    padding: 10px;
    font-size: 13px;
    border-bottom: 1px solid #bcbcbc;
  }

  :global(ul.autocomplete-list > li > strong) {
    font-size: 16px;
  }

  :global(ul.autocomplete-list > li:hover) {
    cursor: pointer;
    background-color: var(--autocomplete-hover);
  }

  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-thumb {
    background: #bcbcbc;
    -webkit-border-radius: 1ex;
    border-radius: 1ex;
  }

  div#destination-autocomplete-load,
  div#origin-autocomplete-load {
    display: none;
  }

</style>