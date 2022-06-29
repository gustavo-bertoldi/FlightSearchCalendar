// ----------------- Calendar types -----------------

export type CalendarScrollDirection = 1 | -1;

export type CalendarScrollType = 'departure' | 'return';

export type DateString = `${string}-${string}-${string}`;

export type DateStringFormatted = `${string}/${string}/${string}`;

export type Datepair = `${DateString}>${DateString}`;

export type RoundtripPrices = {
  date: DateString,
  dateFormatted: DateStringFormatted,
  price?: number,
  priceFormatted?: string
}

export type CalendarData = {
  date: DateString,
  dateFormatted: DateStringFormatted,
  returns: RoundtripPrices[]
}

export type CalendarPrice = {
  price?: number,
  priceFormatted?: string
}

export type CalendarDate = {
  date: DateString,
  dateFormatted: DateStringFormatted
}

export type CalendarPrices = {
  [index: Datepair]: CalendarPrice;
}

export type CalendarRelativePosition = 3 | 2 | 1 | 0 | -1 | -2 | -3;