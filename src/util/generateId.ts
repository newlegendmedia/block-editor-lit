let counter = 0;

export function generateId(prefix = "ID"): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}
