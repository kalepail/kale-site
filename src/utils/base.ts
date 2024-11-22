export function truncate(str: string) {
    return `${str.slice(0, 5)}...${str.slice(-5)}`;
}

export function localStorageToMap() {
    const map: Map<number, [boolean, boolean]> = new Map();

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