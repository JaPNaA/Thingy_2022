export function splitCommandStr(commandStr: string): [string, string] {
    const commandSplitIndex = commandStr.indexOf(":");
    if (commandSplitIndex < 0) {
        return [commandStr, ""];
    } else {
        return [commandStr.slice(0, commandSplitIndex), commandStr.slice(commandSplitIndex + 1)];
    }
}