<script>
  import { onMount, createEventDispatcher, getContext } from 'svelte';
  import { TextField, Button, MaterialApp, Row, Col, ProgressCircular, Icon, Menu, List, ListGroup, ListItem } from 'svelte-materialify';
  import { addDays, format, isAfter, isSameDay } from 'date-fns';
  import { mdiCalendar, mdiFormatTextRotationDownVertical, mdiMenuDown } from '@mdi/js'

  const API_URL = getContext('API_URL');
  const AMADEUS_BLUE = 'rgb(0,94,184)';
  const dispatch = createEventDispatcher();

  //Autocomplete
  let originTimeout;
  let destinationTimeout;
  const timeoutInterval = 750;
  let suggestionsAutocomplete = {
    origin: [],
    destination: []
  }
  let flightOneWayRoundtrip = 'Roundtrip';
  let flightOneWayRoundtripMenuActive;
  let flightClass = 'Economy'
  let classMenuActive;
  let originInput = 'JFK - New York';
  let destinationInput = 'LAX - Los Angeles';
  $: flightOrigin = originInput.substring(0,3);
  $: flightDestination = destinationInput.substring(0,3);
  let originCity = 'New York';
  let destinationCity = 'Los Angeles';
  let flightDepartureDate = '2022-08-01';
  let flightReturnDate = '2022-08-20';
  let nbAdults = '1';
  let searchActive = true;

  const originRules = [
    (v) => {
      searchActive = false;
      if (!v) {
        return 'Please enter the origin city or airport';
      } else if (originCity === destinationCity) {
        return 'Origin and destination must be different';
      }
      searchActive = true;
      return true;
    }
  ]
  const destinationRules = [
    (v) => {
      searchActive = false;
      if (!v) {
        return 'Please enter the destination city or airport';
      } else if (originCity === destinationCity) {
        return 'Origin and destination must be different';
      }
      searchActive = true;
      return true;
    }
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

  function startLoading() {
    document.getElementById('loader-container').style.display = 'flex';
    document.getElementById('search-flights-btn').style.display = 'none';
    document.getElementById('calendar-view-btn').style.visibility = 'hidden';
  }

  function stopLoading() {
    document.getElementById('loader-container').style.display = 'none';
    document.getElementById('search-flights-btn').style.display = 'block';
    document.getElementById('calendar-view-btn').style.visibility = 'visible';
  }

  function autocompleteStartLoading(input) {
    document.getElementById(`${input}-autocomplete-load`).style.display = 'block';
  }

  function autocompleteStopLoading(input) {
    document.getElementById(`${input}-autocomplete-load`).style.display = 'none';
  }

  function getFormData(forCalendar) {
    let formData = {};
    let departureDate = new Date(flightDepartureDate);
    let returnDate = new Date(flightReturnDate);
    formData.origin = flightOrigin;
    formData.destination = flightDestination;
    formData.adults = nbAdults;
    formData.class = flightClass.toUpperCase().replace(" ", "_");

    if (forCalendar) {
      departureDate = dateVerification(departureDate);
      returnDate = dateVerification(returnDate);
      formData.selectedDepartureDate = flightDepartureDate;
      formData.selectedReturnDate = flightReturnDate;
    }

    formData.departureDateFormatted = format(departureDate, 'yyyy-MM-dd');
    formData.returnDateFormatted = format(returnDate, 'yyyy-MM-dd');
    return formData;
  }

  function flightSearch(datesChange) {
    const formData = getFormData(false);
    if (datesChange) dispatch('datesChange', {depDate: formData.departureDateFormatted, retDate: formData.returnDateFormatted});
    else dispatch('searchButtonClicked');
    startLoading();
    const apiURL = `${API_URL}/get-flight-offers`
                    +  `?origin=${formData.origin}`
                    +  `&destination=${formData.destination}`
                    +  `&departureDate=${formData.departureDateFormatted}`
                    +  `&returnDate=${formData.returnDateFormatted}`
                    +  `&adults=${formData.adults}`
                    +  `&travelClass=${formData.class}`;

    const request = new Request(apiURL, { method: 'GET' });
    fetch(request)
      .then(response => response.json())
      .then(offers => {
        stopLoading();
        let data = {
          offers: offers,
          originCity: originCity,
          destinationCity: destinationCity,
          datesChange: datesChange
        };
        dispatch('offersReady', data);
        if (!datesChange) {
          flightSearchCalendar();
        }
      })
      .catch(err => {
        stopLoading();
        dispatch('error');
      });
  }

  function flightSearchCalendar() {
    const formData = getFormData(true);
    const apiURL = `${API_URL}/calendar-view`
                    +  `?origin=${formData.origin}`
                    +  `&destination=${formData.destination}`
                    +  `&departureDate=${formData.departureDateFormatted}`
                    +  `&returnDate=${formData.returnDateFormatted}`
                    +  `&adults=${formData.adults}`;

    const request = new Request(apiURL, { method: 'GET' });
    fetch(request)
      .then(response => response.json())
      .then(flights => {
        dispatch('flightsReady', {
          flights: flights,
          departureDate: formData.departureDateFormatted,
          returnDate: formData.returnDateFormatted,
          origin: formData.origin,
          destination: formData.destination,
          adults: formData.adults,
          selectedDepartureDate: formData.selectedDepartureDate,
          selectedReturnDate: formData.selectedReturnDate
        });
      })
      .catch(err => dispatch('error'));;
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

  function formatString(str) {
    str = str.split(' ');
    str = str.map(word => word = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
    return str.join(' ');
  }


  function searchSuggestion(keyword, input) {
    if (!keyword) return
    autocompleteStartLoading(input);
    const apiURL = `${API_URL}/search-suggestions?keyword=${keyword}`;
    const request = new Request(apiURL, { method: 'GET' });
    fetch(request)
      .then(response => response.json())
      .then(suggestions => {
        suggestionsAutocomplete[input] = [];
        suggestions.data.forEach(sugg => {
          suggestionsAutocomplete[input].push({
            iataCode: sugg.iataCode,
            name: formatString(sugg.name),
            cityName: formatString(sugg.address.cityName)
          });
        });
      })
      .finally(() => autocompleteStopLoading(input));
  }

  function autocompleteSelected(input, suggestion) {
    if (input == 'origin') {
      originCity = suggestion.cityName;
      flightOrigin = suggestion.iataCode;
    } else {
      destinationCity = suggestion.cityName;
      flightDestination = suggestion.iataCode;
    }
    let flightInput = document.getElementById(`fs-flight-${input}`);
    flightInput.value = `${suggestion.iataCode} - ${suggestion.cityName}`;
    flightInput.dispatchEvent(new Event('input'));
  }

  export function newDateSearch(depDate, retDate) {
    document.getElementById('fs-flight-departure-date').value = depDate;
    document.getElementById('fs-flight-return-date').value = retDate;
    flightSearch(true);
  }

  onMount(() => {
    //Flight origin autocomplete event listeners
    document.getElementById('fs-flight-origin').addEventListener('focus', () => {
      document.getElementById('origin-items-list').style.display = 'block'
    });
    document.getElementById('fs-flight-origin').addEventListener('focusout', () => {
      setTimeout(() => {
        document.getElementById('origin-items-list').style.display = 'none'
      }, 200)
    });
    document.getElementById('fs-flight-origin').addEventListener('keydown', function() {
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
      }, 200)
    });
    document.getElementById('fs-flight-destination').addEventListener('keydown', function() {
      clearTimeout(destinationTimeout);
      destinationTimeout = setTimeout(() => searchSuggestion(this.value, 'destination'), timeoutInterval);    
    });
  });

  
</script>
<MaterialApp>
  <Row class="d-flex justify-center">
    <Col cols={12} lg={11}>
      <Menu bind:active={flightOneWayRoundtripMenuActive}>
        <div slot="activator">
          <Button class="upper-menu-button" text style={classMenuActive ? `color: ${AMADEUS_BLUE}` : ''}>
            <Icon path={mdiMenuDown} rotate={flightOneWayRoundtripMenuActive ? 180 : 0}/>
            {flightOneWayRoundtrip}
          </Button>
        </div>
        <List style="width: 145px;">
          <ListItem on:click={() => flightOneWayRoundtrip = 'Roundtrip'}>Roundtrip</ListItem>
          <ListItem on:click={() => flightOneWayRoundtrip = 'One-way'}>One-way</ListItem>
        </List>
      </Menu>
      <Menu bind:active={classMenuActive}>
        <div slot="activator">
          <Button text class="upper-menu-button" style={classMenuActive ? `color: ${AMADEUS_BLUE}` : ''}>
            <Icon path={mdiMenuDown} rotate={classMenuActive ? 180 : 0}/>
            {flightClass}
          </Button>
        </div>
        <List>
          <ListItem on:click={() => flightClass = 'Economy'}>Economy</ListItem>
          <ListItem on:click={() => flightClass = 'Premium economy'}>Premium economy</ListItem>
          <ListItem on:click={() => flightClass = 'Business'}>Business</ListItem>
          <ListItem on:click={() => flightClass = 'First'}>First</ListItem>
        </List>
      </Menu>
    </Col>
  </Row>
  <Row class="d-flex justify-center">
    <Col cols={12} sm={12} lg={3}>
      <form autocomplete="off">
        <div class="autocomplete-origin">
          <TextField id="fs-flight-origin" class="fs-text-field" color={AMADEUS_BLUE} bind:value={originInput} rules={originRules}>
            <div slot="append" id="origin-autocomplete-load">
              <Icon>
                <ProgressCircular indeterminate color={AMADEUS_BLUE}/>
              </Icon>
            </div>
            Flight origin
          </TextField>
        </div>
		      <ul class="autocomplete-list" id="origin-items-list">
			      {#each suggestionsAutocomplete.origin as sugg, _}
				      <li on:click={() => autocompleteSelected('origin', sugg)} style="display: flex;">
                <div class="autocomplete-iata">
                  <span style="font-weight: bold; font-size: 16px;">{sugg.iataCode}</span>
                </div>
                <div class="autocomplete-airport-city">
                  <span style="font-weight: 500; font-size: 14px;">{sugg.cityName}</span>
                  <span>{sugg.name}</span>
                </div>
              </li>
			      {/each}			
		      </ul>
      </form>
    </Col>
    <Col cols={12} sm={12} lg={3}>
      <form autocomplete="off">
        <div class="autocomplete-destination">
          <TextField id="fs-flight-destination" class="fs-text-field" color={AMADEUS_BLUE} bind:value={destinationInput} rules={destinationRules}>
            <div slot="append" id="destination-autocomplete-load">
              <Icon>
                <ProgressCircular indeterminate color={AMADEUS_BLUE}/>
              </Icon>
            </div>
            Flight destination
          </TextField>
        </div>
		      <ul class="autocomplete-list" id="destination-items-list">
			      {#each suggestionsAutocomplete.destination as sugg, _}
				      <li on:click={() => autocompleteSelected('destination', sugg)} style="display: flex;">
                <div class="autocomplete-iata">
                  <span style="font-weight: bold; font-size: 16px;">{sugg.iataCode}</span>
                </div>
                <div class="autocomplete-airport-city">
                  <span style="font-weight: 500; font-size: 14px;">{sugg.cityName}</span>
                  <span>{sugg.name}</span>
                </div>
              </li>
			      {/each}			
		      </ul>
      </form>
    </Col>
    <Col cols={5} sm={5} lg={2}><TextField id="fs-flight-departure-date" class="fs-text-field" color={AMADEUS_BLUE} type="date" min={format(new Date(), 'yyyy-MM-dd')} on:change={departureDateSelected} rules={departureDateRules} bind:value={flightDepartureDate}>Departure</TextField></Col>
    <Col cols={5} sm={5} lg={2}><TextField id="fs-flight-return-date" class="fs-text-field" color={AMADEUS_BLUE} type="date" rules={returnDateRules} bind:value={flightReturnDate}>Return</TextField></Col>
    <Col cols={2} sm={2} lg={1}><TextField id="fs-adults" class="fs-text-field" type="number" color={AMADEUS_BLUE} rules={adultsRules} bind:value={nbAdults}>Adults</TextField></Col>
    <Col cols={12} sm={12} lg={12} class="d-flex justify-center">
      <Button class="white-text search-btn" id="search-flights-btn" disabled={!searchActive} on:click={() => flightSearch(false)}>Search</Button>
    </Col>
  </Row>
  <div class="d-flex justify-center" id="loader-container" style="display: none">
    <ProgressCircular indeterminate color={AMADEUS_BLUE}/>
  </div>

  
</MaterialApp>

<style>
  :root {
    --autocomplete-hover: #d9dfe6;
    --amadeus-blue: rgb(0,94,184);
  }

  :global(button.search-btn),
  :global(#calendar-view-btn)  {
    background-color: var(--amadeus-blue);
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

  div.autocomplete-iata {
    display: flex;
    justify-content: center; 
    align-items: center; 
    margin-right: 8px;
    background-color: rgb(184, 213, 233);
    border-radius: 6px;
    width: 60px;
  }

  div.autocomplete-airport-city {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  :global(button.upper-menu-button) {
    color: #7b7b7b;
    padding: 0px 5px !important;
    min-width: 150px !important;
    margin-left: -10px;
  }

  :global(button.upper-menu-button > span) {
    justify-content: flex-start !important;
  }

  :global(button.upper-menu-button:hover) {
    color: var(--amadeus-blue);
  }

</style>