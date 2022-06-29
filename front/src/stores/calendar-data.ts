import { writable, type Writable } from 'svelte/store';
import type { CalendarData } from '$types/calendar';

export const calendarData: Writable<CalendarData[]> = writable([]);
