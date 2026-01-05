import React, { useState, useMemo } from 'react';
import { Box, Modal, Typography, IconButton } from '@mui/material';
import { FaTimes } from 'react-icons/fa';
import SearchBar from '../common/SearchBar';
import SelectFilter from '../common/SelectFilter';
import { BaseDataGrid } from '../common/BaseDataGrid';

import { initialStockData } from '../../data/mockData';

const statusOptions = ["Ok", "Subdimensionado", "Ruptura iminente", "Excesso"];
const fornecedorOptions = ["NSK", "Timken", "FRM", "BGL", "IKO", "SAV"];

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: 800,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: '8px',
};

export default function AddItemModal({ open, onClose, onAddItem }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [fornecedor, setFornecedor] = useState("");

    const columns = useMemo(() => [
        {
            field: "item",
            headerName: "Item",
            minWidth: 180,
            flex: 1.5,
            headerAlign: "left",
            align: "left",
        },
        {
            field: "fornecedor",
            headerName: "Fornecedor",
            minWidth: 150,
            flex: 1,
            headerAlign: "left",
            align: "left",
        },
        {
            field: "unidades",
            headerName: "Unidades",
            type: "number",
            minWidth: 100,
            flex: 0.7,
            headerAlign: "left",
            align: "left",
        },
        {
            field: "dias_cobertura",
            headerName: "Dias de Cobertura",
            type: "number",
            minWidth: 150,
            flex: 1,
            headerAlign: "left",
            align: "left",
        },
    ], []);

    const handleRowClick = (params) => {
        if (onAddItem) {
            onAddItem(params.row);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="add-item-modal-title"
        >
            <Box sx={style}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography id="add-item-modal-title" variant="h6" component="h2">
                        Adicionar Novo Item ao Pedido
                    </Typography>
                    <IconButton onClick={onClose}>
                        <FaTimes />
                    </IconButton>
                </Box>

                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <SearchBar
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por item..."
                    />
                    <SelectFilter
                        label="Status"
                        name="status"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        options={statusOptions}
                    />
                    <SelectFilter
                        label="Fornecedor"
                        name="fornecedor"
                        value={fornecedor}
                        onChange={(e) => setFornecedor(e.target.value)}
                        options={fornecedorOptions}
                    />
                </div>

                <Box sx={{ width: '100%' }}>
                    <BaseDataGrid
                        rows={initialStockData}
                        columns={columns}
                        onRowClick={handleRowClick}
                        headerStyle="alternative"
                    />
                </Box>
                
            </Box>
        </Modal>
    );
}
