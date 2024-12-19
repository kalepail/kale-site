import { writable, type Writable } from 'svelte/store';
import { kale } from '../utils/passkey-kit';

export const contractBalance: Writable<bigint | null> = writable();

export async function updateContractBalance(address: string) {
    const { result } = await kale.balance({ id: address })
    contractBalance.set(result);
}