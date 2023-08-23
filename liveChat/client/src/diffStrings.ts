
/** Diffs a string with a single difference (added/removed/replaced substring). */
export function diffStrings(original: string, currentValue: string): { start: number, end: number, text: string } | null {
    let hadChange = false;
    let sameToIndex: number;
    const maxLength = Math.max(original.length, currentValue.length);
    for (sameToIndex = 0; sameToIndex < maxLength; sameToIndex++) {
        if (currentValue[sameToIndex] !== original[sameToIndex]) {
            hadChange = true;
            break;
        }
    }

    if (!hadChange) { return null; } // no changes

    const currentValueLen = currentValue.length;
    const lastValueLen = original.length;
    const maxBackwardSearch = Math.min(currentValueLen, lastValueLen) - sameToIndex;
    let sameToIndexRev;
    for (sameToIndexRev = 1; sameToIndexRev <= maxBackwardSearch; sameToIndexRev++) {
        if (currentValue[currentValueLen - sameToIndexRev] !== original[lastValueLen - sameToIndexRev]) {
            break;
        }
    }
    if (sameToIndexRev <= 1) {
        return {
            start: sameToIndex,
            end: maxLength,
            text: currentValue.slice(sameToIndex)
        };
    }

    console.log(sameToIndex, sameToIndexRev);

    return {
        start: sameToIndex,
        end: original.length + 1 - sameToIndexRev,
        text: currentValue.slice(sameToIndex, 1 - sameToIndexRev),
    };
}