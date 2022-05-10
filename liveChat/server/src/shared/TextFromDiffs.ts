export interface TextDiff {
    start: number;
    end: number;
    text: string;
};

export class TextFromDiffs {
    private _text: string;

    constructor(text?: string) {
        this._text = text || "";
    }

    public getText() {
        return this._text;
    }

    public setText(text: string) {
        this._text = text;
    }

    public applyDiff(diff: TextDiff) {
        const before = this._text.slice(0, diff.start);
        const after = this._text.slice(diff.end);
        this._text = before + diff.text + after;
    }

    public clear() {
        this._text = "";
    }
}
