import type { Block } from "./kale";

export function truncate(str: string, length: number = 5) {
    return `${str.slice(0, length)}...${str.slice(-length)}`;
}

export function countZeros(hash: Uint8Array) {
    let zeroCount = 0;

    for (let char of Buffer.from(hash).toString('hex').split('')) {
        if (char !== '0')
            break;
        zeroCount++;
    }

    return zeroCount;
}

export function setBlocks(blocks: Map<number, Block | undefined>) {
    const serialized_blocks = Array.from(blocks.entries())
        .filter(([index, block]) => block)
        .map(([index, block]) => {
            const serialized_block = JSON.parse(JSON.stringify(block, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            ));

            return [index, serialized_block];
        });

    localStorage.setItem('kale:blocks', JSON.stringify(serialized_blocks));
}

export function getBlocks(): Map<number, Block | undefined> {
    const blocks = new Map<number, Block | undefined>();
    const serialized_blocks = JSON.parse(localStorage.getItem('kale:blocks') || '[]');

    for (const [index, serializedBlock] of serialized_blocks) {
        const block = JSON.parse(JSON.stringify(serializedBlock), (key, value) => {
            if (/^-?\d+$/.test(value)) {
                return BigInt(value);
            }

            return value;
        });

        blocks.set(Number(index), block);
    }

    return blocks;
}

export function getPails(index?: number) {
    const map: Map<number, [
        boolean, // planted
        boolean, // worked
        string | null, // staked (important it's a number so '0' is true vs 0 is false)
        [number, number] | null, // work [zeros, gap]
        string | null // harvested (type important for same reason as `staked`)
    ]> = new Map();

    // TODO rehydrate this on login from some 24 hr reverse lookup

    processStorage(map, sessionStorage, index);
    processStorage(map, localStorage, index);

    return map
}

function processStorage(
    map: Map<number, [
        boolean,
        boolean,
        string | null,
        [number, number] | null,
        string | null
    ]>, 
    storage: Storage, 
    curr_index?: number
) {
    Object.keys(storage).sort().forEach((key) => {
        if (key.includes('kale:')) {
            let [, index_, type] = key.split(':');

            if (type) {
                let index = Number(index_);

                if (
                    (type !== 'harvest' && curr_index && curr_index > index + 12)
                    || (type === 'harvest' && curr_index && curr_index > index + 288) // 24 hrs
                ) {
                    // Clean out old storage items
                    storage.removeItem(key);
                } else if (type === 'plant') {
                    let curr = map.get(index) || [true, false, null, null, null];
                    curr[0] = true;
                    curr[2] = storage.getItem(key);
                    map.set(index, curr);
                } else if (type === 'work') {
                    let value = storage.getItem(key);
                    let curr = map.get(index) || [true, true, null, null, null];
                    curr[1] = true;
                    curr[3] = value && JSON.parse(value);
                    map.set(index, curr);
                } else if (type === 'harvest') {
                    let curr = map.get(index) || [true, true, null, null, null];
                    curr[4] = storage.getItem(key);
                    map.set(index, curr);
                }
            }
        }
    });
}