export interface TextDiff {
    start: number;
    end: number;
    text: string;
};

export function textFromDiff(text: string, diff: TextDiff): string {
    const before = text.slice(0, diff.start);
    const after = text.slice(diff.end);
    return before + diff.text + after;
}
