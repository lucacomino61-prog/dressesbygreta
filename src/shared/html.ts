/**
 * Escaping template tag shared by the Worker (server rendering) and the browser (drawers, bag).
 * Every interpolated value is escaped unless it is already a `Raw` produced by `html` or `raw`.
 * Admin-entered text (names, descriptions) only ever reaches markup through here.
 */
export class Raw {
  constructor(readonly value: string) {}
  toString(): string {
    return this.value;
  }
}

export type Html = string | number | null | undefined | false | Raw | Html[];

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const esc = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, (c) => ESC[c]!);

/** Mark trusted markup (never user input) as already safe. */
export const raw = (markup: string): Raw => new Raw(markup);

function render(value: Html): string {
  if (value === null || value === undefined || value === false) return '';
  if (value instanceof Raw) return value.value;
  if (Array.isArray(value)) return value.map(render).join('');
  return esc(value);
}

export function html(strings: TemplateStringsArray, ...values: Html[]): Raw {
  let out = strings[0] ?? '';
  for (let i = 0; i < values.length; i++) out += render(values[i]!) + (strings[i + 1] ?? '');
  return new Raw(out);
}

/** Join rendered fragments. */
export const join = (parts: Html[]): Raw => new Raw(parts.map(render).join(''));
