import { useCallback, useState } from "react";

/**
 * Controlador reutilizavel que isola o estado de abertura dos popovers por coluna.
 */
export function useColumnPopover() {
    const [state, setState] = useState({ anchorEl: null, columnId: null });

    const openPopover = useCallback((event, columnId) => {
        setState({ anchorEl: event.currentTarget, columnId });
    }, []);

    const closePopover = useCallback(() => {
        setState({ anchorEl: null, columnId: null });
    }, []);

    return {
        anchorEl: state.anchorEl,
        activeColumnId: state.columnId,
        openPopover,
        closePopover,
    };
}
