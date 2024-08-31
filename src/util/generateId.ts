
let counter = 0;

export function generateId(): string {
    counter += 1;
    return `${Date.now()}-${counter}`;
}