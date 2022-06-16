export interface FlightOffersSearchResult {

}

export interface AirportCitySearchResult {

}

export interface FlightCheapestDatesResult {

}

export type FlightSearchForm = {
  origin: string;
  destination: string;
  adults: number;
  class: string;
  departureDateFormatted: string;
  returnDateFormatted: string;
  selectedDepartureDate?: string;
  selectedReturnDate?: string;
}

export type AutocompleteSuggestion = {
  iataCode: string;
  name: string;
  cityName: string;
}

export type AutocompleteSuggestions = {
  [index: string]: AutocompleteSuggestion[];
}

export type CalendarData = {
  departures: string[];
  returns: string[];
  prices: {
    [index: string]: {
      priceFormatted: string,
      price: string
    }
  }
  maxPrice: number,
  minPrice: number
};

export type CalendarScrollDirection = 1 | -1;

export type CalendarScrollType = 'departures' | 'returns';

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
}

export type FlightItinerary = {
  duration: string;
  stops: string;
  departureAirport: string;
  departureTime: SVGAnimatedInteger;
  departureDate: string;
  arrivalAirport: string;
  arrivalTime: string;
  arrivalDate: string;
  segments: FlightSegment[];
  priceFormatted?: string;
  offerId: string;
}

export type FlightOffer = {
  priceFrom: string;
  validatingAirline: string;
  outbound: FlightItinerary;
  inbounds: FlightItinerary[];
}

export type TravelClass = 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';