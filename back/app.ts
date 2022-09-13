import express from "express";
import { format, addDays } from "date-fns";
import bodyParser from "body-parser";
import path from "path";
import Amadeus from "amadeus";
import dotenv from "dotenv";
import Bottleneck from "bottleneck";

dotenv.config();

//Load server parameters
const PORT = process.env.PORT || "3000";
if (!process.env.AMADEUS_CLIENT_ID)
  throw new Error("AMADEUS_CLIENT_ID environment variable could not be read");
if (!process.env.AMADEUS_CLIENT_SECRET)
  throw new Error(
    "AMADEUS_CLIENT_SECRET environment variable could not be read"
  );

//Configure express
let app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', '..', 'front', 'build')));
//Add logger
app.use((req, _, next) => {
  let requestReceived = new Date();
  req.on('end', () => {
    let time = (Date.now() - requestReceived.getTime())/1000;
    console.log(`Request from ${req.ip} at ${requestReceived.toLocaleString()} completed in ${time.toFixed(2)}s. ${req.method} ${req.url.split('?')[0]}.`);
  });
  next();
})

//Configure Amadeus
const AMADEUS_HOST = process.env.AMADEUS_ENV || "test";
let amadeus = new Amadeus({
  hostname: AMADEUS_HOST,
});

// Configure bottleneck based on API rate limits for different environments
// Test - 10 tx/sec - No more than one request each 100ms
// Production - 40tx/sec
let limiterArgs: any;
if (AMADEUS_HOST === 'test') {
  limiterArgs = {
    minTime: 100,
    maxConcurrent: 50
  }
} else {
  limiterArgs = {
    reservoir: 40,
    reservoirRefreshAmount: 40,
    reservoirRefreshInterval: 1000,
    maxConcurrent: 50
  }
}
const limiter = new Bottleneck(limiterArgs);

// ======================= HELPER FUNCTIONS =======================

/**
 * Helper function to convert a uppercase string to first-letter uppercase
 * Ex.: NEW YORK CITY -> New York City
 * @param {string} str Input uppercase string
 * @returns {string} Output
 */
function formatString(str: string): string {
  return str
    .split(/[ -]/)
    .map(
      (word) =>
        (word = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    )
    .join(" ");
}

/**
 * Helper function to convert a string in the format PTxxHyyM to xx h yy m
 * Takes into account special cases when hours or minutes are equal to zero
 * @param str Input value
 * @return Formatted string
 */
function formatDuration(str: string): string {
  let hasHours = str.includes("H");
  let hasMinutes = str.includes("M");
  let durationHours = hasHours ? str.split("PT")[1].split("H")?.[0] : "0";
  let durationMinutes: string;
  let formatted: string;

  if (hasHours && hasMinutes) {
    durationMinutes = str.split("PT")[1].split("H")[1].split("M")[0];
    formatted = `${durationHours} h ${durationMinutes} min`;
  } else if (hasMinutes) {
    durationMinutes = str.split("PT")[1].split("M")[0];
    formatted = `${durationMinutes} min`;
  } else {
    formatted = `${durationHours} h`;
  }

  return formatted;
}

function sameOutbound(it1: any, it2: any): boolean {
  if (it1.segments.length != it2.segments.length) return false;
  let it1Flights = it1.segments.map(
    (seg: any) => seg.carrierCode + seg.carrierName
  );
  let it2Flights = it2.segments.map(
    (seg: any) => seg.carrierCode + seg.carrierName
  );
  return it1Flights.every((flight: any) => it2Flights.includes(flight));
}

function generateCalendarDatepairs(
  departureDate: string,
  returnDate: string
): string[] {
  let datepairs: string[] = [];
  let _departure = new Date(departureDate);
  let _return = new Date(returnDate);
  for (let i = -3; i <= 3; i++) {
    let newDeparture = addDays(_departure, i);
    for (let j = -3; j <= 3; j++) {
      let newReturn = addDays(_return, j);
      datepairs.push(
        `${format(newDeparture, "yyyy-MM-dd")}>${format(
          newReturn,
          "yyyy-MM-dd"
        )}`
      );
    }
  }
  return datepairs;
}

// ======================= API FUNCTIONS =======================

function getSearchSuggestions(keyword: string): Promise<any> {
  return new Promise((resolve, reject) => {
    amadeus.referenceData.locations
      .get({
        subType: Amadeus.location.any,
        keyword: keyword,
      })
      .then((response: any) => {
        let suggestions = response.result.data.map((entry: any) => {
          return {
            iataCode: entry.iataCode,
            name: formatString(entry.name),
            cityName: formatString(entry.address.cityName),
          };
        });
        resolve(suggestions);
      })
      .catch((err: any) => reject(err));
  });
}

function getFlightOffers(
  originLocationCode: string,
  destinationLocationCode: string,
  departureDate: string,
  returnDate: string,
  adults: string,
  travelClass: string
) {
  return limiter
    .schedule(() =>
      amadeus.shopping.flightOffersSearch.get({
        originLocationCode,
        destinationLocationCode,
        departureDate,
        returnDate,
        adults,
        travelClass
      })
    )
    .then((res: any) => {
      let response = JSON.parse(res.body);
      const currencyFormatter = Intl.NumberFormat("en-US", {
        style: "currency",
        currency: response.data[0].price.currency,
      });

      let offers: any[] = [];
      response.data.forEach((offer: any) => {
        let offerData: any = {};
        offerData.priceFrom = currencyFormatter.format(offer.price.total);
        offerData.validatingAirline = offer.validatingAirlineCodes[0];

        offer.itineraries.forEach((itinerary: any, i: number) => {
          let itineraryData: any = {};
          let nbSegments = itinerary.segments.length;
          itineraryData.duration = formatDuration(itinerary.duration);
          itineraryData.stops = `${nbSegments == 1
              ? "Nonstop"
              : nbSegments - 1 + " stop" + (nbSegments >= 3 ? "s" : "")
            }`;

          itineraryData.segments = itinerary.segments.map(
            (segment: any, i: number) => {
              let segmentData: any = {};
              let segmentArrivalTime = new Date(segment.arrival.at);
              let carrierCode =
                segment.operating?.carrierCode || segment.carrierCode;
              segmentData.departureDate = format(
                new Date(segment.departure.at),
                "EEEE, d MMMM"
              );
              segmentData.arrivalDate = format(
                new Date(segment.arrival.at),
                "EEEE, d MMMM"
              );
              segmentData.departureTime = format(
                new Date(segment.departure.at),
                "HH:mm"
              );
              segmentData.arrivalTime = format(segmentArrivalTime, "HH:mm");
              segmentData.duration = formatDuration(segment.duration);
              segmentData.origin = segment.departure.iataCode;
              segmentData.destination = segment.arrival.iataCode;
              segmentData.carrierCode = carrierCode;
              segmentData.carrierName = formatString(
                response.dictionaries.carriers[carrierCode]
              );
              segmentData.flightNumber = segment.number;
              segmentData.aircraft = formatString(
                response.dictionaries.aircraft[segment.aircraft.code]
              );
              segmentData.class =
                formatString(
                  offer.travelerPricings[0].fareDetailsBySegment
                    .find((fd: any) => fd.segmentId === segment.id)
                    .cabin.replace("_", " ")
                ) || "";

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
                let nextDeparture = new Date(
                  itinerary.segments[i + 1].departure.at
                );
                let stopTime =
                  nextDeparture.getTime() - segmentArrivalTime.getTime();
                let minutes = (stopTime / (60 * 1000)) % 60;
                let hours = Math.floor(stopTime / (60 * 60 * 1000));
                segmentData.stopDuration = `${hours} h ${minutes} min`;
              }
              return segmentData;
            }
          );

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

      return offers;
    })
    .catch((err: any) => {
      return err;
    });
}

/**
 * Search flights 3 days before and after the given departure and return dates
 * @param {string} origin Origin locator code
 * @param {string} destination Destination locator code
 * @param {string} departureDate in yyyy-MM-dd format
 * @param {string} returnDate in yyyy-MM-dd format
 */
function pricesForDatepairs(
  origin: string,
  destination: string,
  adults: string,
  travelClass: string,
  datepairs: string[]
) {
  return new Promise((resolve, reject) => {
    let flights: any = {};
    let responseCount = 0;
    let errorCount = 0;

    datepairs.forEach((datepair) => {
      let currentDeparture = datepair.split(">")[0];
      let currentReturn = datepair.split(">")[1];
      limiter.schedule(() =>
          amadeus.shopping.flightOffersSearch.get({
            originLocationCode: origin,
            destinationLocationCode: destination,
            departureDate: currentDeparture,
            returnDate: currentReturn,
            adults: adults,
            max: 1,
            travelClass: travelClass,
          })
        )
        .then((response: any) => {
          const currencyFormatter = Intl.NumberFormat("en-US", {
            style: "currency",
            currency: response.data[0].price.currency,
          });
          flights[datepair] = {
            price: parseFloat(response.data[0].price.total),
            priceFormatted: currencyFormatter.format(
              response.data[0].price.total
            ),
          };
        })
        .catch((_) => {
          errorCount++;
          flights[datepair] = {};
        })
        .finally(() => {
          responseCount++;
          if (responseCount === datepairs.length) {
            console.log(
              `Request completed with ${responseCount - errorCount
              } successes and ${errorCount} errors.`
            );
            resolve(flights);
          }
        });
    });
  });
}

// ======================= ROUTES =======================

app.listen(PORT, () => {
  console.log(`Server started successfully\nEnvironment: ${AMADEUS_HOST}\nListening on port ${PORT}`);
});

app.get("/search-suggestions", (req, res) => {
  getSearchSuggestions(req.query.keyword as string)
    .then((suggestions) => res.send(suggestions))
    .catch((err) => {
      console.error(err);
      res.status(500).send(err);
    });
});

app.get("/get-flight-offers", (req, res) => {
  getFlightOffers(
    req.query.origin as string,
    req.query.destination as string,
    req.query.departureDate as string,
    req.query.returnDate as string,
    (req.query.adults as string) || "1",
    (req.query.travelClass as string) || "ECONOMY"
  )
    .then((flights) => res.send(flights))
    .catch((err) => {
      console.error(err);
      res.status(500).send(err);
    });
});

app.get("/calendar-view", (req, res) => {
  let datepairs = generateCalendarDatepairs(req.query.departureDate as string, req.query.returnDate as string);
  pricesForDatepairs(
    req.query.origin as string,
    req.query.destination as string,
    (req.query.adults as string) || "1",
    (req.query.travelClass as string) || "ECONOMY",
    datepairs
  )
  .then((flights) => res.send(flights))
  .catch((err) => {
    res.status(500).send(err);
  });
});

app.post("/flights-for-datepairs", (req, res) => {
  pricesForDatepairs(
    req.body.origin,
    req.body.destination,
    req.body.adults,
    req.body.travelClass,
    req.body.datepairs
  )
  .then((flights) => res.send(flights))
  .catch((err) => {
    console.error(err);
    res.status(500).send(err);
  });
});

app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "../front/public/index.html"));
});
