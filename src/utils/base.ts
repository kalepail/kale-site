export function truncate(str: string, length: number = 5) {
    return `${str.slice(0, length)}...${str.slice(-length)}`;
}

export function localStorageToMap() {
    const map: Map<number, [boolean, boolean]> = new Map();

    // TODO rehydrate this on login from some 24 hr reverse lookup

    Object.keys(localStorage).sort().forEach((key) => {
        if (key.includes('kale:')) {
            let [, index, type] = key.split(':');

            if (type) {
                if (type === 'plant') {
                    map.set(Number(index), [true, false]);
                } else if (type === 'work') {
                    map.set(Number(index), [true, true]);
                }
            }
        }
    });

    return map
}