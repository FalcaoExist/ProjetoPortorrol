import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Hook generico que encapsula a logica de filtros
 */
export function useEntityFilters({ config }) {
    // Garante que configuracoes sejam memorizadas para evitar recalculos desnecessarios
    const normalizedConfig = useMemo(() => config, [config]);

    const initialState = useMemo(() => {
        // Monta o estado inicial a partir dos filtros definidos na configuracao
        return Object.entries(normalizedConfig).reduce((accumulator, [key, definition]) => {
            accumulator[key] = definition.initialValue ?? "";
            return accumulator;
        }, {});
    }, [normalizedConfig]);

    const [filters, setFilters] = useState(initialState);

    useEffect(() => {
        // Sincroniza filtros quando a configuracao muda preservando valores ja informados
        setFilters((previous) => {
            if (!previous) {
                return initialState;
            }

            const next = { ...initialState };
            Object.keys(next).forEach((key) => {
                if (Object.prototype.hasOwnProperty.call(previous, key)) {
                    next[key] = previous[key];
                }
            });
            return next;
        });
    }, [initialState]);

    const handleFilterChange = useCallback((key, value) => {
        // Atualiza apenas o filtro especificado sem perder os demais
        setFilters((previous) => ({
            ...previous,
            [key]: value ?? "",
        }));
    }, []);

    const resetFilters = useCallback(() => {
        // Retorna todos os filtros para seus valores iniciais
        setFilters(initialState);
    }, [initialState]);

    const applyFilters = useCallback(
        (rows) => {
            if (!Array.isArray(rows) || rows.length === 0) {
                return rows;
            }

            return rows.filter((row) =>
                Object.entries(normalizedConfig).every(([key, definition]) => {
                    const filterValue = filters[key];
                    // Verifica se deve aplicar o filtro com base nas regras definidas
                    const shouldApply = definition.shouldApply
                        ? definition.shouldApply(filterValue)
                        : filterValue !== "" && filterValue !== undefined && filterValue !== null;

                    if (!shouldApply) {
                        return true;
                    }

                    if (!definition.predicate) {
                        return true;
                    }

                    // Executa o predicado do filtro para decidir se a linha permanece
                    return definition.predicate(row, filterValue);
                })
            );
        },
        [filters, normalizedConfig]
    );

    return {
        filters,
        handleFilterChange,
        resetFilters,
        applyFilters,
    };
}
