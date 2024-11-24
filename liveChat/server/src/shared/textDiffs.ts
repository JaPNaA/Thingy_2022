/**
 * 0: text
 * 1: start
 * 2: end (default = start)
 */
export type TextDiff = [string, number, number?];

export function textFromDiff(text: string, diff: TextDiff): string {
    const [newText, start, end] = diff;
    const before = text.slice(0, start);
    const after = text.slice(end ?? start);
    return before + newText + after;
}
