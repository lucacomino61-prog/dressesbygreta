/**
 * The bag: dresses the visitor wants to ask about. Kept in memory only (no storage of any kind);
 * she copies the list into her Instagram message.
 */
type Listener = (ids: string[]) => void;

const ids: string[] = [];
const listeners = new Set<Listener>();

function emit(): void {
  const snapshot = [...ids];
  listeners.forEach((l) => l(snapshot));
}

export const bag = {
  ids: (): string[] => [...ids],
  has: (id: string): boolean => ids.includes(id),
  add(id: string): void {
    if (!ids.includes(id)) {
      ids.push(id);
      emit();
    }
  },
  remove(id: string): void {
    const i = ids.indexOf(id);
    if (i >= 0) {
      ids.splice(i, 1);
      emit();
    }
  },
  toggle(id: string): boolean {
    if (ids.includes(id)) {
      bag.remove(id);
      return false;
    }
    bag.add(id);
    return true;
  },
  subscribe(l: Listener): () => void {
    listeners.add(l);
    l([...ids]);
    return () => listeners.delete(l);
  },
};
