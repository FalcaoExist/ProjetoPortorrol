import { useEffect, useRef } from "react";

/**
 Fechar automaticamente menus dropdown quando o usuário clica 
 ou toca em qualquer lugar fora daquele menu específico.
 */
export function useClickOutside(onOutsideClick) {
    const nodeRef = useRef(null);

    useEffect(() => {
        function handleEvent(event) {
            if (!nodeRef.current || nodeRef.current.contains(event.target)) {
                return;
            }
            onOutsideClick?.();
        }

        document.addEventListener("mousedown", handleEvent);
        document.addEventListener("touchstart", handleEvent);

        return () => {
            document.removeEventListener("mousedown", handleEvent);
            document.removeEventListener("touchstart", handleEvent);
        };
    }, [onOutsideClick]);

    return nodeRef;
}
