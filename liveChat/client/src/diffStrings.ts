import { TextDiff } from "./shared/textDiffs";

/** Diffs a string with a single difference (added/removed/replaced substring). */
export function diffStrings(original: string, currentValue: string): TextDiff | null {
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
        return createTextDiff(
            currentValue.slice(sameToIndex),
            sameToIndex,
            lastValueLen
        );
    }

    return createTextDiff(
        currentValue.slice(sameToIndex, 1 - sameToIndexRev),
        sameToIndex,
        lastValueLen + 1 - sameToIndexRev
    );
}

function createTextDiff(text: string, start: number, end: number): TextDiff {
    if (start == end) {
        return [text, start];
    } else {
        return [text, start, end];
    }
}