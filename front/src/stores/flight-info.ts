import type { FlightItinerary, FlightOffer, Trip } from '$types/flight';
import { writable, type Writable } from 'svelte/store';

export const offersResult: Writable<FlightOffer[] | undefined> = writable(undefined);
export const origin: Writable<string> = writable('JFK - New York');
export const destination: Writable<string> = writable('LAX - Los Angeles');
export const departureDate: Writable<string> = writable('2022-08-01');
export const returnDate: Writable<string> = writable('2022-08-20');
export const adults: Writable<number> = writable(1);
export const flightClass: Writable<string> = writable('Economy');
export const legs: Writable<string> = writable('Roundtrip');
export const chosenOffer: Writable<FlightOffer | undefined> = writable();
export const chosenReturn: Writable<FlightItinerary | undefined> = writable();
export const trip: Writable<Trip | undefined> = writable();