import { addDays, format } from 'date-fns';
import { derived, writable, type Readable, type Writable } from 'svelte/store';
import { CONSTANTS } from './constants';
import type { DateString } from '$types/calendar';
import type { FlightItinerary, FlightOffer, FlightSearchFunction, Trip } from '$types/flight';

function _flightSearch(
	apiURL: string,
	origin: string,
	destination: string,
	departure: DateString,
	_return: DateString,
	adults: number,
	flightClass: string
): Promise<FlightOffer[]> {
	const requestURL =
		`${apiURL}/get-flight-offers` +
		`?origin=${origin}` +
		`&destination=${destination}` +
		`&departureDate=${departure}` +
		`&returnDate=${_return}` +
		`&adults=${adults}` +
		`&travelClass=${flightClass}`;
	const request = new Request(requestURL, { method: 'GET' });

	return new Promise((resolve, reject) => {
		fetch(request)
			.then((response) => response.json())
			.then((offers: FlightOffer[]) => resolve(offers))
			.catch((err) => reject(err));
	});
}

export const origin: Writable<string> = writable('JFK - New York');
export const originIATA: Readable<string> = derived(origin, ($origin) => $origin.substring(0, 3));
export const originCity: Readable<string> = derived(origin, ($origin) => $origin.substring(6));

export const destination: Writable<string> = writable('LAX - Los Angeles');
export const destinationIATA: Readable<string> = derived(destination, ($destination) =>
	$destination.substring(0, 3)
);
export const destinationCity: Readable<string> = derived(destination, ($destination) =>
	$destination.substring(6)
);

export const departureDate: Writable<Date> = writable(new Date());
export const departureDateFormatted: Readable<DateString> = derived(
	departureDate,
	($departureDate) => format($departureDate, 'yyyy-MM-dd') as DateString
);
export const returnDate: Writable<Date> = writable(addDays(new Date(), 10));
export const returnDateFormatted: Readable<DateString> = derived(
	returnDate,
	($returnDate) => format($returnDate, 'yyyy-MM-dd') as DateString
);

export const adults: Writable<number> = writable(1);

export const flightClass: Writable<string> = writable('Economy');
export const flightClassFormatted: Readable<string> = derived(flightClass, ($flightClass) =>
	$flightClass.toUpperCase().replace(' ', '_')
);

export const legs: Writable<string> = writable('Roundtrip');

export const offersResult: Writable<FlightOffer[] | undefined> = writable(undefined);

export const chosenOffer: Writable<FlightOffer | undefined> = writable();
export const chosenReturn: Writable<FlightItinerary | undefined> = writable();
export const trip: Writable<Trip | undefined> = writable();

export const flightSearch: Readable<FlightSearchFunction> = derived(
	[
		CONSTANTS,
		originIATA,
		destinationIATA,
		departureDateFormatted,
		returnDateFormatted,
		adults,
		flightClassFormatted
	],
	($v) => () => _flightSearch($v[0].API_URL, $v[1], $v[2], $v[3], $v[4], $v[5], $v[6])
);
