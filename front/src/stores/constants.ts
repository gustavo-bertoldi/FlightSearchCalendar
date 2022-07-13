import { readable, type Readable } from 'svelte/store';

export const CONSTANTS: Readable<{ [index: string]: string }> = readable({
	AMADEUS_BLUE: 'rgb(0,94,184)',
	API_URL: 'http://54.75.219.41'
});
