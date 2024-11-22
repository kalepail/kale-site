import { writable, type Writable } from 'svelte/store';

export const keyId: Writable<string | null> = writable();

if (localStorage.hasOwnProperty("kale:keyId")) {
    keyId.set(localStorage.getItem("kale:keyId")!);
}