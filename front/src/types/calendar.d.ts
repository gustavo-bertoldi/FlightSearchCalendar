// ----------------- Calendar types -----------------

export type CalendarScrollDirection = 1 | -1;

export type CalendarScrollType = 'departures' | 'returns';

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

export type DateString = `${string}-${string}-${string}`;

export type Datepair = `${DateString}>${DateString}`;

export type CalendarPrices = {
  [index: Datepair]: string;
}