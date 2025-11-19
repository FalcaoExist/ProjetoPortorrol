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

// This component encapsulates the common styling and structure
export const BaseDataGrid = ({ headerStyle = 'default', ...props }) => {
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
                ...headerStylesConfig[headerStyle]
            },
            '& .MuiDataGrid-cell': {
                fontFamily: 'Poppins',
                color: 'rgb(55 65 81)',
                padding: '12px',
                borderBottom: '1px solid #e5e7eb', // Explicitly set border for consistency
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
                disableColumnFilter
                disableColumnMenu
                disableColumnSelector
                disableDensitySelector
                getRowId={(row) => row.id}
                slots={{
                    noRowsOverlay: () => (
                        <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary', fontFamily: 'Poppins' }}>
                            Nenhum registro encontrado.
                        </Box>
                    ),
                }}
                localeText={{
                    noRowsLabel: 'Nenhum registro encontrado.',
                    toolbarDensity: 'Densidade',
                    toolbarExport: 'Exportar',
                    toolbarFilters: 'Filtros',
                    toolbarColumns: 'Colunas',
                    footerRowSelected: () => '',
                }}
                {...props} // Pass all other props down
            />
        </Box>
    );
};
