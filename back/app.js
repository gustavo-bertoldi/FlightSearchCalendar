const express = require('express');
const format = require('date-fns/format');
const addDays = require('date-fns/addDays')
const bodyParser = require('body-parser');
const url = require('url');
const Amadeus = require('amadeus');
require('dotenv/config');

//Load server parameters
const PORT = process.env.PORT || 3000;
if (!process.env.AMADEUS_CLIENT_ID) throw new Error('API_KEY environment vairable could not be read');
if (!process.env.AMADEUS_CLIENT_SECRET) throw new Error('API_SECRET environment vairable could not be read');

//Configure express
let app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:8080");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//Configure Amadeus
let amadeus = new Amadeus();

/**
 * @param {int} ms Time to wait in ms
 * @returns 
 */
function wait(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
}

//Server variables
let lastSearchRequest = new Date();

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

    await wait(100);

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
          flights[datepair] = response.data;
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
        await wait(100);
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

    //Test limits: 10 tx/s, 1tx/100ms
    await wait(100);

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
        flights[datepair] = response.data;
      }).catch((err) => {
        errorCount++;
        flights[datepair] = 'error';
        if (err.response.statusCode != 429) reject(err);
      }).finally(() => {
        responseCount++;
        if (responseCount == expectedResponses) {
          console.log(`Request completed with ${responseCount - errorCount} successes and ${errorCount} errors out of ${expectedResponses} API requests.`)
          resolve(flights);
        }
      });

      //Test limits: 10 tx/s, 1tx/100ms
      await wait(100);
    });
  });
}

function getSearchSuggestions(keyword) {
  return new Promise((resolve, reject) => {
    amadeus.referenceData.locations.get({
      subType: Amadeus.location.any,
      keyword: keyword
    })
    .then(response => resolve(response))
    .catch(err => reject(err))
  });
}

function getFlightOffers(origin, destination, departureDate, returnDate, adults, travelClass) {
  return new Promise(async (resolve, reject) => {
    await wait(100);
    amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departureDate,
      returnDate: returnDate,
      adults: adults,
      max: 30,
      travelClass: travelClass
    }).then((response) => {
      resolve(response.data);
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
    await wait(100);
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
