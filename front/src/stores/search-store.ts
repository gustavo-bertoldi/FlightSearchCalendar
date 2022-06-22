import type { FlightOffer } from 'src/types/flight';
import { writable, type Writable } from 'svelte/store';

export const offersResult: Writable<FlightOffer[]> = writable([]);