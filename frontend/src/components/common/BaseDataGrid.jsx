import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/material';

const headerStylesConfig = {
    default: {
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb',
      color: '#111827',
    },
    alternative: {
      backgroundColor: 'rgb(243 244 246)',
      color: 'rgb(75 85 99)',
    }
};

// Encaspulamento de estilos e arquitetura
export const BaseDataGrid = ({
    headerStyle = 'default',
    disableColumnFilter = true,
    disableColumnMenu = true,
    disableColumnSelector = true,
    disableDensitySelector = true,
    slots = {},
    slotProps = {},
    ...props
}) => {
    const mergedSlots = {
        noRowsOverlay: () => (
            <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary', fontFamily: 'Poppins' }}>
                Nenhum registro encontrado.
            </Box>
        ),
        ...slots,
    };

    return (
        <Box sx={{
            height: 400,
            width: '100%',
            fontFamily: 'Poppins',
            color: '#111827',
            '& .MuiDataGrid-root': { border: 'none', borderRadius: '8px' },
            '& .MuiDataGrid-columnHeaders': {
                fontFamily: 'Poppins',
                fontWeight: 'normal',
                borderBottom: "1px solid #e5e7eb",
                ...headerStylesConfig[headerStyle]
            },
            // Oculta as colunas de preenchimento automáticas que aparecem em branco no fim da tabela
            '& .MuiDataGrid-columnHeader--filler': {
                display: 'none',
            },
            '& .MuiDataGrid-columnHeaderTitle':{
                color: "black",
                fontWeight: 'normal',

            },
            '& .MuiDataGrid-cell': {
                fontFamily: 'Poppins',
                color: 'rgb(55 65 81)',
                borderBottom: '1px solid #e5e7eb', 
            },
            '& .cell-notes': {
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                alignItems: 'flex-start',
                paddingTop: '12px',
                paddingBottom: '12px',
                lineHeight: 1.35,
            },
            '& .MuiDataGrid-cell--filler': {
                display: 'none',
            },
            '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f9fafb',
            },
            '& .MuiDataGrid-footerContainer': {
                fontFamily: 'Poppins',
                color: '#111827',
            },
        }}>
            <DataGrid
                disableColumnFilter={disableColumnFilter}
                disableColumnMenu={disableColumnMenu}
                disableColumnSelector={disableColumnSelector}
                disableDensitySelector={disableDensitySelector}
                getRowId={(row) => row.id}
                slots={mergedSlots}
                slotProps={slotProps}
                localeText={{
                    noRowsLabel: 'Nenhum registro encontrado.',
                    toolbarDensity: 'Densidade',
                    toolbarExport: 'Exportar',
                    toolbarFilters: 'Filtros',
                    toolbarColumns: 'Colunas',
                    footerRowSelected: () => '',
                }}
                {...props} 
            />
        </Box>
    );
};
