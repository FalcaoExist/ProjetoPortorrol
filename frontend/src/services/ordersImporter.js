// Serviço utilitário para importar pedidos de arquivos Excel/CSV
import * as XLSX from "xlsx";

/**
 * Converte serial Excel para string ISO (YYYY-MM-DD)
 */
function excelSerialToISO(serial) {
    if (serial == null || serial === "") return null;
    if (serial instanceof Date) return serial.toISOString().split('T')[0];
    if (typeof serial !== 'number') return null;
    const ms = Math.round((serial - 25569) * 86400 * 1000);
    const d = new Date(ms);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
}

const dateColumnNames = [
    'Requested date',
    'Confirmed date',
    'Data Entrega (DD/MM/AAAA)',
    'Data Solicitada (DD/MM/AAAA)',
    'Data Entrega',
    'Data Solicitada'
];

function isDateColumn(col) {
    if (!col) return false;
    const c = col.toString().trim().toLowerCase();
    return dateColumnNames.some(name => name.toLowerCase() === c) ||
        /requested date|confirmed date|data entrega|data solicitada/.test(c);
}

export async function importOrdersFromExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { cellDates: true });
                const processed = json.map(row => {
                    const newRow = { ...row };
                    Object.keys(newRow).forEach(k => {
                        if (isDateColumn(k)) {
                            const val = newRow[k];
                            const iso = excelSerialToISO(val);
                            if (iso) newRow[k] = iso;
                        }
                    });
                    return newRow;
                });
                resolve(processed);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}
