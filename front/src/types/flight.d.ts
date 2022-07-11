// ----------------- Flight types -----------------

export type FlightSearchForm = {
	origin: string;
	destination: string;
	adults: number;
	class: string;
	departureDateFormatted: string;
	returnDateFormatted: string;
	selectedDepartureDate?: string;
	selectedReturnDate?: string;
};

export type FlightOffer = {
	priceFrom: string;
	validatingAirline: string;
	outbound: FlightItinerary;
	inbounds: FlightItinerary[];
};

export type FlightItinerary = {
	duration: string;
	stops: string;
	departureAirport: string;
	departureTime: string;
	departureDate: string;
	arrivalAirport: string;
	arrivalTime: string;
	arrivalDate: string;
	segments: FlightSegment[];
	priceFormatted?: string;
	offerId: string;
};

export type FlightSegment = {
	departureDate: string;
	arrivalDate: string;
	departureTime: string;
	arrivalTime: string;
	duration: string;
	origin: string;
	destination: string;
	carrierCode: string;
	carrierName: string;
	flightNumber: string;
	aircraft: string;
	class: string;
	stopDuration?: string;
};

export type TravelClass = 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';

export type Trip = {
	validatingAirline: string;
	price: string;
	outbound: FlightItinerary;
	inbound: FlightItinerary;
};

export type FlightSearchFunction = () => Promise<FlightOffer[]>;
