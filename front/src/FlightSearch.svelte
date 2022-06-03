<script>
  import { onMount, createEventDispatcher, getContext } from 'svelte';
  import { TextField, Button, MaterialApp, Row, Col, ProgressCircular, Icon, Menu, List, ListGroup, ListItem } from 'svelte-materialify';
  import { addDays, format, isAfter, isSameDay } from 'date-fns';
  import { mdiCalendar, mdiFormatTextRotationDownVertical, mdiMenuDown } from '@mdi/js'

  const API_URL = getContext('API_URL');
  const AMADEUS_BLUE = 'rgb(0,94,184)';
  const dispatch = createEventDispatcher();

  //Autocomplete variables
  //The timeouts are used to store the interval between keypresses by the user
  //The objective is to start a request to the autocomplete service when user stops typing
  let originTimeout;
  let destinationTimeout;
  const timeoutInterval = 750;
  let suggestionsAutocomplete = {
    origin: [],
    destination: []
  }

  //Form values, the initialized values are the default ones in the form, no values means an empty field
  let flightOneWayRoundtrip = 'Roundtrip';
  let flightOneWayRoundtripMenuActive;
  let flightClass = 'Economy'
  let classMenuActive;
  let originInput = 'JFK - New York';
  let destinationInput = 'LAX - Los Angeles';
  //Variables starting with a $ are Svelte's dynamic variables. They are recalculated each time
  //one of it's dependent variables changes value. Used to calculate origin and destination IATA codes
  //from the input fields that are in the format 'IATA - City name'
  $: flightOrigin = originInput.substring(0,3);
  $: flightDestination = destinationInput.substring(0,3);
  let originCity = 'New York';
  let destinationCity = 'Los Angeles';
  let flightDepartureDate = '2022-08-01';
  let flightReturnDate = '2022-08-20';
  let nbAdults = '1';
  let searchActive = true;

  //Rules to check form validity
  //Origin can't be empty neither equal to destination
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
  //Destination can't be empty neither equal to origin
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
  //Departure date can't be empty
  const departureDateRules = [
    (v) => !!v || 'Please enter the date of departure'
  ]
  //Return date can't be empty
  const returnDateRules = [
    (v) => !!v || 'Please enter the date of return'
  ]
  //Adults can't be empty
  const adultsRules = [
    (v) => !!v || 'Please enter number of adults'
  ]

  /**
   * Helper function to validate dates
   * This function advances the selected date by one, two or three days depending on the distance of
   * today's date. This needs to be done because calendar shows prices from up to three days before
   * the selected dates, but these dates can't be in the past.
   * Ex.: The user selects tomorrow date as departure date, dates from -1 and -2 days would be in the
   * past. So we advance the selected date by two days to avoid past dates while keeping the selected
   * date shown in the calendar.
   * @param {Date} date Date to be verified
   * @return {Date} Verified and valid date 
   */
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

  /**
   * Helper function to start loading.
   */
  function startLoading() {
    document.getElementById('loader-container').style.display = 'flex';
    document.getElementById('search-flights-btn').style.display = 'none';
    document.getElementById('calendar-view-btn').style.visibility = 'hidden';
  }

  /**
   * Helper function to stop loading.
   */
  function stopLoading() {
    document.getElementById('loader-container').style.display = 'none';
    document.getElementById('search-flights-btn').style.display = 'block';
    document.getElementById('calendar-view-btn').style.visibility = 'visible';
  }

  /**
   * Helper function to start loading on input field given in parameter
   * @param {string} input Input field. Can take values 'origin' and 'destination'
   */
  function autocompleteStartLoading(input) {
    document.getElementById(`${input}-autocomplete-load`).style.display = 'block';
  }

  /**
   * Helper function to stop loading on input field given in parameter
   * @param {string} input Input field. Can take values 'origin' and 'destination'
   */
  function autocompleteStopLoading(input) {
    document.getElementById(`${input}-autocomplete-load`).style.display = 'none';
  }

  /**
   * Helper function to retrieve and prepare data entered in the search form to be sent in the request
   * @param {boolean} forCalendar This parameter is used to perform additional verification on date fields
   * and return additional parameter in the case of a calendar scroll
   * @returns {object} Object containing all the needed data, after treatment, to be sent in the request
   */
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

  /**
   * Sends the request to the backend and dispatches an event when the response is received.
   * The parameter datesChange indicates that the source of the new request is a click on a
   * new datepair in the calendar. This dispatches a different event because the responses
   * are treated differently.
   * @param {boolean} datesChange Indicates if the source of the request is a click on a
   * new datepair in the calendar
   */
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
          datesChange: datesChange,
          travelClass: formData.class
        };
        dispatch('offersReady', data);
        if (!datesChange) {
          flightSearchCalendar();
        }
      })
      .catch(err => {
        stopLoading();
        console.log(err)
        dispatch('error');
      });
  }

  /**
   * Sends a request to the backend to retrieve the prices for the calendar component
   */
  function flightSearchCalendar() {
    const formData = getFormData(true);
    const apiURL = `${API_URL}/calendar-view`
                    +  `?origin=${formData.origin}`
                    +  `&destination=${formData.destination}`
                    +  `&departureDate=${formData.departureDateFormatted}`
                    +  `&returnDate=${formData.returnDateFormatted}`
                    +  `&adults=${formData.adults}`
                    +  `&travelClass=${formData.class}`;

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
          selectedReturnDate: formData.selectedReturnDate,
          travelClass: formData.class
        });
      })
      .catch(err => {
        console.log(err)
        dispatch('error')
      });
  }

  /**
   * Listener to departure date change, perform date verification and sets the minimum
   * return date to the selected one.
   */
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

  /**
   * Helper function to convert a uppercase string to first-letter uppercase
   * Ex.: NEW YORK CITY -> New York City
   * @param {string} str Input uppercase string
   * @returns {string} Output
   */
  function formatString(str) {
    str = str.split(' ');
    str = str.map(word => word = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
    return str.join(' ');
  }


  /**
   * Listener for keydown event. Sends the autocomplete request
   * @param {string} keyword Value of input field 
   * @param {string} input Input field, can take values 'origin' and 'destination'
   */
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

  /**
   * Listener when user selects a suggestion from the autocomplete list
   * Inserts the selected suggestion in the corresponding input field
   * @param {string} input Input, can take values 'origin' and 'destination'
   * @param {object} suggestion Object containing the selected suggestion data
   * such as IATA code and city name.
   */
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

  /**
   * Listener to event from the Calendar component when a new datepair is selected
   * @param {string} depDate New departure date in the format 'yyyy-MM-dd'
   * @param {string} retDate New return date in the format 'yyyy-MM-dd'
   */
  export function newDateSearch(depDate, retDate) {
    document.getElementById('fs-flight-departure-date').value = depDate;
    document.getElementById('fs-flight-return-date').value = retDate;
    flightDepartureDate = depDate;
    flightReturnDate = retDate;
    flightSearch(true);
  }

  /**
   * Svelte's onMount function is called when DOM finished loading.
  */
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