// Pure helpers to keep supplier history logic decoupled from UI.

export function createSnapshotEntry(supplier, notes = "") {
    if (!supplier?.id) return null;
    const now = new Date();
    return {
        id: `${supplier.id}-${now.getTime()}`,
        recordedAt: now.toISOString(),
        start: supplier.start,
        end: supplier.end,
        budget: supplier.budget,
        leadtime: supplier.leadtime,
        notes: notes || "Snapshot dos dados em vigor.",
    };
}

export function appendSnapshot(historyBySupplier, supplierId, entry) {
    if (!supplierId || !entry) return historyBySupplier;
    const current = historyBySupplier?.[supplierId] || [];
    return {
        ...historyBySupplier,
        [supplierId]: [entry, ...current],
    };
}
