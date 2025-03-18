import { writable, type Writable } from 'svelte/store';

export const turnstileToken: Writable<string | null> = writable();

export function turnstileCallback(token: string) {
    turnstileToken.set(token);
}