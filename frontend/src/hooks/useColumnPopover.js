import { useCallback, useRef, useState } from "react";

/**
 * Controlador reutilizavel que isola o estado de abertura dos popovers por coluna.
 */
export function useColumnPopover() {
    const [state, setState] = useState({ anchorEl: null, columnId: null });
    const lastAnchorRef = useRef(null);

    const openPopover = useCallback((event, columnId) => {
        lastAnchorRef.current = event.currentTarget;
        setState({ anchorEl: event.currentTarget, columnId });
    }, []);

    const closePopover = useCallback(() => {
        // Antes de remover o popover, restaura o foco ao elemento que o abriu (se disponível)
        try {
            const el = lastAnchorRef.current;
            if (el && typeof el.focus === "function") {
                el.focus();
            }
        } catch (e) {
            // silencioso — não queremos quebrar a aplicação por falha no focus
        }
        lastAnchorRef.current = null;
        setState({ anchorEl: null, columnId: null });
    }, []);

    return {
        anchorEl: state.anchorEl,
        activeColumnId: state.columnId,
        openPopover,
        closePopover,
    };
}
