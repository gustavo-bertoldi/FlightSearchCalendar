const express = require('express');
const format = require('date-fns/format');
const addDays = require('date-fns/addDays')
const bodyParser = require('body-parser');
const url = require('url');
const Amadeus = require('amadeus');
const { isThisQuarter } = require('date-fns');
require('dotenv/config');

//Load server parameters
const PORT = process.env.PORT || 3000;
if (!process.env.AMADEUS_CLIENT_ID) throw new Error('AMADEUS_CLIENT_ID environment variable could not be read');
if (!process.env.AMADEUS_CLIENT_SECRET) throw new Error('AMADEUS_CLIENT_SECRET environment variable could not be read');
if (!process.env.CORS_ALLOW) throw new Error('CORS_ALLOW environment variable could not be read');
const waitTime = process.env.ENV.endsWith('PROD') ? 25 : 100;

//Configure express
let app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", `http://${process.env.CORS_ALLOW}`);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


//Configure Amadeus
const amadeusHostname = process.env.ENV.endsWith('PROD') ? 'production' : 'test';
let amadeus = new Amadeus({
  hostname: amadeusHostname
});

/**
 * @param {int} ms Time to wait in ms
 * @returns 
 */
function wait(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
}

//Helper functions
/**
 * Helper function to convert a string in the format PTxxHyyM to xx h yy m
 * Takes into account special cases when hours or minutes are equal to zero
 * @param str Input value
 * @return Formatted string
 */
function formatDuration(str) {
  let hasHours = str.includes('H');
  let hasMinutes = str.includes('M')
  let durationHours = hasHours ? str.split('PT')[1].split('H')?.[0] : '0';
  let durationMinutes;
  let formatted;

  if (hasHours && hasMinutes) {
    durationMinutes = str.split('PT')[1].split('H')[1].split('M')[0];
    formatted = `${durationHours} h ${durationMinutes} min`;
  } else if (hasMinutes) {
    durationMinutes = str.split('PT')[1].split('M')[0];
    formatted = `${durationMinutes} min`;
  } else {
    formatted = `${durationHours} h`;
  }

  return formatted;
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

function sameOutbound(it1, it2) {
  if (it1.segments.length != it2.segments.length) return false;
  let it1Flights = it1.segments.map(seg => seg.carrierCode + seg.carrierName);
  let it2Flights = it2.segments.map(seg => seg.carrierCode + seg.carrierName);
  return it1Flights.every(flight => it2Flights.includes(flight));
}

/**
 * Search flights 3 days before and after the given departure and return dates
 * @param {string} origin Origin locator code
 * @param {string} destination Destination locator code
 * @param {string} departureDate in yyyy-MM-dd format
 * @param {string} returnDate in yyyy-MM-dd format
 */
function getCheapestDates(origin, destination, departureDate, returnDate, adults, travelClass) {
  return new Promise(async (resolve, reject) => {
    let depDate = new Date(departureDate);
    let retDate = new Date(returnDate);
    let flights = {};
    let responseCount = 0;
    let errorCount = 0;

    await wait(waitTime);

    for (let i = -3; i <= 3; i++) {
      let currentDepDate = format(addDays(depDate, i), 'yyyy-MM-dd');

      for (let j = -3; j <= 3; j++) {
        let currentRetDate = format(addDays(retDate, j), 'yyyy-MM-dd');
        let datepair = `${currentDepDate.toString()}>${currentRetDate.toString()}`

        amadeus.shopping.flightOffersSearch.get({
          originLocationCode: origin,
          destinationLocationCode: destination,
          departureDate: currentDepDate,
          returnDate: currentRetDate,
          adults: adults,
          max: 1,
          travelClass: travelClass
        }).then((response) => {
          const currencyFormatter = Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: response.data[0].price.currency
          });
          flights[datepair] = currencyFormatter.format(response.data[0].price.total);
        }).catch((err) => {
          errorCount++;
          flights[datepair] = 'error';
          console.error(`Get cheapest dates. Error ${err.response.statusCode} - ${err.description[0].title}`);
          if (err.response.statusCode != 429) reject(err);
        }).finally(() => {
          responseCount++;
          if (responseCount == 49) {
            console.log(`Request completed with ${responseCount - errorCount} successes and ${errorCount} errors.`)
            resolve(flights);
          }
        });

        //Test limits: 10 tx/s, 1tx/100ms
        await wait(waitTime);
      }
    }

  });
}

/**
 * 
 * @param {string} origin 
 * @param {string} destination 
 * @param {number} adults 
 * @param {object} datepairs  
 */
function getCheapestDatepairs(origin, destination, adults, datepairs, travelClass) {
  return new Promise(async (resolve, reject) => {
    let flights = {};
    let responseCount = 0;
    let errorCount = 0;
    let expectedResponses = datepairs.length;

    datepairs.forEach(async (datepair) => {
      let departureDate = datepair.split('>')[0];
      let returnDate = datepair.split('>')[1];

      amadeus.shopping.flightOffersSearch.get({
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate: departureDate,
        returnDate: returnDate,
        adults: adults,
        max: 1,
        travelClass: travelClass
      }).then((response) => {
        const currencyFormatter = Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: response.data[0].price.currency
        });
        flights[datepair] = currencyFormatter.format(response.data[0].price.total);
      }).catch((err) => {
        errorCount++;
        flights[datepair] = 'error';
      }).finally(() => {
        responseCount++;
        if (responseCount == expectedResponses) {
          console.log(`Request completed with ${responseCount - errorCount} successes and ${errorCount} errors out of ${expectedResponses} API requests.`)
          resolve(flights);
        }
      });

      //Test limits: 10 tx/s, 1tx/100ms
      await wait(waitTime);
    });
  });
}

function getSearchSuggestions(keyword) {
  return new Promise((resolve, reject) => {
    amadeus.referenceData.locations.get({
      subType: Amadeus.location.any,
      keyword: keyword
    })
    .then(response => {
      let suggestions = response.result.data.map(entry => {
        return {
          iataCode: entry.iataCode,
          name: entry.name,
          cityName: entry.address.cityName
        }
      });
      resolve(suggestions);
    })
    .catch(err => reject(err))
  });
}

function getFlightOffers(origin, destination, departureDate, returnDate, adults, travelClass) {
  return new Promise(async (resolve, reject) => {
    await wait(5*waitTime);
    amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departureDate,
      returnDate: returnDate,
      adults: adults,
      max: 250,
      travelClass: travelClass
    }).then(async (response) => {
      const currencyFormatter = Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: response.data[0].price.currency
      });
      
      let citiesCodes = {};
      let carrierCodes = {};
      response.data.forEach(offer => {
        offer.itineraries.forEach(itinerary => {
          itinerary.segments.forEach(segment => {
            /*TODO - For city names
            [segment.departure.iataCode, segment.arrival.iataCode].forEach(code => {
              if (!citiesCodes[code]) citiesCodes[code] = " ";
            });
            */
            let carrierCode = segment.operating?.carrierCode || segment.carrierCode;
            if (!carrierCodes[carrierCode]) carrierCodes[carrierCode] = " ";
          });
        });
      });

      let carriers = await amadeus.referenceData.airlines.get({
        airlineCodes: Object.keys(carrierCodes).join(',')
      });
      carriers.data.forEach(carrier => {
        carrierCodes[carrier.iataCode] = formatString(carrier.businessName);
      });

      let offers = [];
      response.data.forEach(offer => {
        let offerData = {};
        offerData.priceFrom = currencyFormatter.format(offer.price.total);
        offerData.validatingAirline = offer.validatingAirlineCodes[0];

        offer.itineraries.forEach((itinerary, i) => {
          let itineraryData = {};
          let nbSegments = itinerary.segments.length;
          itineraryData.duration = formatDuration(itinerary.duration);
          itineraryData.stops = `${nbSegments == 1 ? 'Nonstop' : (nbSegments - 1) + ' stop' + (nbSegments >= 3 ? 's' : '')}`;

          itineraryData.segments = itinerary.segments.map((segment, i) => {
            let segmentData = {};
            let segmentArrivalTime = new Date(segment.arrival.at);
            let carrierCode = segment.operating?.carrierCode || segment.carrierCode;
            segmentData.departureDate = format(new Date(segment.departure.at), 'EEEE, d MMMM');
            segmentData.arrivalDate = format(new Date(segment.arrival.at), 'EEEE, d MMMM');
            segmentData.departureTime = format(new Date(segment.departure.at), 'HH:mm');
            segmentData.arrivalTime = format(segmentArrivalTime, 'HH:mm');
            segmentData.duration = formatDuration(segment.duration);
            segmentData.origin = segment.departure.iataCode;
            segmentData.destination = segment.arrival.iataCode;
            segmentData.carrierCode = carrierCode;
            segmentData.carrierName = carrierCodes[carrierCode];
            segmentData.flightNumber = segment.number;
            segmentData.aircraft = segment.aircraft.code;
            segmentData.class = formatString(offer.travelerPricings[0].fareDetailsBySegment.find(fd => fd.segmentId === segment.id).cabin.replace('_', ' ')) || '';

            if (i === 0) {
              itineraryData.departureAirport = segment.departure.iataCode;
              itineraryData.departureTime = segmentData.departureTime;
              itineraryData.departureDate = segmentData.departureDate;
            }
            if (i === itinerary.segments.length - 1) {
              itineraryData.arrivalAirport = segment.arrival.iataCode;
              itineraryData.arrivalTime = segmentData.arrivalTime;
              itineraryData.arrivalDate = segmentData.arrivalDate;
            }

            if (i < nbSegments - 1) {
              let nextDeparture = new Date(itinerary.segments[i + 1].departure.at);
              let stopTime = nextDeparture - segmentArrivalTime;
              let minutes = (stopTime / (60 * 1000)) % 60;
              let hours = Math.floor(stopTime / (60 * 60 * 1000));
              segmentData.stopDuration = `${hours} h ${minutes} min`;
            }
            return segmentData;
          });

          if (i === 0) offerData.outbound = itineraryData;
          else {
            offerData.inbounds = [itineraryData];
            itineraryData.priceFormatted = offerData.priceFrom;
            itineraryData.offerId = offer.id;
            offers.forEach((offer) => {
              if (sameOutbound(offer.outbound, offerData.outbound)) {
                  offer.inbounds.push(itineraryData);
                  offerData.added = true;
              }
            });
          }
        });
        if (!offerData.added) offers.push(offerData);
      });

      
      resolve(offers);
    }).catch((err) => {
      reject(err);
    });
  });
}

function airlineLookup(airlines) {
  let airlineCodes = airlines.reduce((acc, airline, i) => {
    acc += airline;
    if (i !== airlines.length - 1) acc += ',';
    return acc;
  }, '');

  return new Promise(async (resolve, reject) => {
    await wait(waitTime);
    amadeus.referenceData.airlines.get({
      airlineCodes: airlineCodes
    }).then((response) => {
      resolve(response.data);
    }).catch((err) => {
      reject(err);
    });
  });
}

//=============== ROUTES ===============

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`)
});

app.get('/calendar-view', (req, res) => {
  getCheapestDates(req.query.origin, req.query.destination, req.query.departureDate, req.query.returnDate, req.query.adults, req.query.travelClass)
    .then((flights) => res.send(flights))
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.post('/flights-for-datepairs', (req, res) => {
  getCheapestDatepairs(req.body.origin, req.body.destination, req.body.adults, req.body.datepairs, req.body.travelClass)
    .then(flights => res.send(flights))
    .catch(err => {
      console.error(err)
      res.status(500).send(err);
    });
});

app.get('/search-suggestions', (req, res) => {
  getSearchSuggestions(req.query.keyword)
    .then(suggestions => res.send(suggestions))
    .catch(err => {
      console.error(err)
      res.status(500).send(err)
    });
});

app.get('/get-flight-offers', (req, res) => {
  getFlightOffers(req.query.origin, req.query.destination, req.query.departureDate, req.query.returnDate, req.query.adults, req.query.travelClass)
    .then(flights => res.send(flights))
    .catch(err => {
      console.error(err);
      res.status(500).send(err);
    });
});

app.post('/airline-lookup', (req, res) => {
  airlineLookup(req.body)
    .then(airlines => res.send(airlines))
    .catch(err => {
      console.error(err);
      res.status(500).send(err);
    });
});
