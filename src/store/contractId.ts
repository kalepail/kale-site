import { writable, type Writable } from 'svelte/store';

export const contractId: Writable<string | null> = writable();