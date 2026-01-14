import { writable, type Writable } from 'svelte/store';

export const turnstileToken: Writable<string | null> = writable(null);

export function turnstileCallback(token: string) {
    turnstileToken.set(token);
}
