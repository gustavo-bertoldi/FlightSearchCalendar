import { derived, writable, type Readable, type Writable } from 'svelte/store';
import { CONSTANTS } from './constants';
import {
	adults,
	departureDateFormatted,
	destinationIATA,
	flightClassFormatted,
	originIATA,
	returnDateFormatted
} from './flight_search';
import type {
	CalendarDate,
	CalendarPrices,
	CellDate,
	Datepair,
	DateString,
	DateStringFormatted,
	FetchCalendarFunction,
	FetchNewPricesFunction
} from '$types/calendar';
import { addDays, differenceInDays, format } from 'date-fns';

function dateValidation(date: Date): Date {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const daysFromToday = differenceInDays(date, today);
	if (daysFromToday < 3) date = addDays(date, 3 - daysFromToday);
	return date;
}

function datesArray(current?: DateString): CalendarDate[] {
	if (!current) return [];
	const array: CalendarDate[] = [];
	const _current = dateValidation(new Date(current));

	for (let i = -3; i <= 3; i++) {
		const newDate = addDays(_current, i);
		array.push({
			date: format(newDate, 'yyyy-MM-dd') as DateString,
			dateFormatted: format(newDate, 'dd/MM/yyyy') as DateStringFormatted
		});
	}
	return array;
}

function _fetchCalendar(
	apiURL: string,
	origin: string,
	destination: string,
	departure: DateString | undefined,
	_return: DateString | undefined,
	adults: number,
	flightClass: string
): Promise<CalendarPrices> {
	const requestURL =
		`${apiURL}/calendar-view` +
		`?origin=${origin}` +
		`&destination=${destination}` +
		`&departureDate=${departure}` +
		`&returnDate=${_return}` +
		`&adults=${adults}` +
		`&travelClass=${flightClass}`;
	const request = new Request(requestURL, { method: 'GET' });

	return new Promise<CalendarPrices>((resolve, reject) => {
		if (!departure || !_return) reject();
		fetch(request)
			.then((response) => response.json())
			.then((data: CalendarPrices) => resolve(data))
			.catch((err) => reject(err));
	});
}

function _fetchNewPrices(
	apiURL: string,
	origin: string,
	destination: string,
	adults: number,
	travelClass: string,
	datepairs: Datepair[]
): Promise<CalendarPrices> {
	const url = `${apiURL}/flights-for-datepairs`;
	const data = { datepairs, origin, destination, adults, travelClass };
	const options = {
		method: 'POST',
		body: JSON.stringify(data),
		headers: { 'Content-Type': 'application/json; charset=UTF-8' }
	};
	const request = new Request(url, options);
	return new Promise((resolve, reject) => {
		fetch(request)
			.then((response) => response.json())
			.then((prices: CalendarPrices) => resolve(prices))
			.catch((err) => reject(err));
	});
}

export const selectedPriceCell: Writable<CellDate> = writable();
export const calendar: Writable<CalendarPrices> = writable({});
export const departureDates: Writable<CalendarDate[]> = writable([]);
export const returnDates: Writable<CalendarDate[]> = writable([]);
const currentDeparture: Readable<DateString | undefined> = derived(
	departureDates,
	($v) => $v[3]?.date
);
const currentReturn: Readable<DateString | undefined> = derived(returnDates, ($v) => $v[3]?.date);
departureDateFormatted.subscribe((v) => departureDates.set(datesArray(v)));
returnDateFormatted.subscribe((v) => returnDates.set(datesArray(v)));

// =============== API functions ===============
export const fetchCalendar: Readable<FetchCalendarFunction> = derived(
	[
		CONSTANTS,
		originIATA,
		destinationIATA,
		currentDeparture,
		currentReturn,
		adults,
		flightClassFormatted
	],
	($v) => () => _fetchCalendar($v[0].API_URL, $v[1], $v[2], $v[3], $v[4], $v[5], $v[6])
);
export const fetchNewPrices: Readable<FetchNewPricesFunction> = derived(
	[CONSTANTS, originIATA, destinationIATA, adults, flightClassFormatted],
	($v) => (newDatepairs: Datepair[]) =>
		_fetchNewPrices($v[0].API_URL, $v[1], $v[2], $v[3], $v[4], newDatepairs)
);
