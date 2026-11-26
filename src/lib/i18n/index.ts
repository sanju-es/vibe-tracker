import type { MessageKey } from "./keys";
import { messages } from "./en";

export type { MessageKey };
export { messages };

export function t(key: MessageKey, values?: Record<string, string | number>): string {
  const template = messages[key] ?? key;
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}

export function statusLabelKey(key: string): MessageKey {
  return `status.${key}` as MessageKey;
}

export function categoryLabelKey(category: string): MessageKey {
  return `category.${category}` as MessageKey;
}
