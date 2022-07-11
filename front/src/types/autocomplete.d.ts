// ----------------- Autocomplete types -----------------

export type AutocompleteSuggestion = {
	iataCode: string;
	name: string;
	cityName: string;
};

export type AutocompleteSuggestions = {
	[index: string]: AutocompleteSuggestion[];
};

export type AutocompleteInput = 'origin' | 'destination';

export type InputRule = (v: string) => string | true;
