import { useEffect, useMemo, useState } from "react";
import { subscribeToList } from "./countService";

const INITIAL = { items: [], session: null, loaded: false };

/**
 * Estado de la lista del usuario:
 * - items: renglones con su detalle por palet
 * - session: { totalPallets, currentPallet } o null si no se empezó
 * - totals: { units, products, palletUnits (lecturas del palet en curso) }
 */
export function useListState(userId) {
  const [state, setState] = useState(INITIAL);

  useEffect(() => {
    if (!userId) {
      setState(INITIAL);
      return undefined;
    }

    return subscribeToList(
      userId,
      (data) => setState({ ...data, loaded: true }),
      () => setState((previous) => ({ ...previous, loaded: true })),
    );
  }, [userId]);

  const totals = useMemo(() => {
    const current = state.session ? String(state.session.currentPallet) : null;
    let units = 0;
    let palletUnits = 0;

    state.items.forEach((item) => {
      units += Number(item.quantity || 0);

      if (current) {
        palletUnits += Number(item.pallets?.[current] || 0);
      }
    });

    return { units, products: state.items.length, palletUnits };
  }, [state]);

  return { ...state, totals };
}
