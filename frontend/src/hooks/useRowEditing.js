import { useState, useCallback } from 'react';
import { GridRowModes } from '@mui/x-data-grid';

export const useRowEditing = () => {
    const [rowModesModel, setRowModesModel] = useState({});

    const handleEditClick = useCallback((id) => () => {
        setRowModesModel(prev => ({ ...prev, [id]: { mode: GridRowModes.Edit } }));
    }, []);

    const handleSaveClick = useCallback((id) => () => {
        setRowModesModel(prev => ({ ...prev, [id]: { mode: GridRowModes.View } }));
    }, []);

    const handleCancelClick = useCallback((id) => () => {
        setRowModesModel(prev => ({
            ...prev,
            [id]: { mode: GridRowModes.View, ignoreModifications: true },
        }));
    }, []);

    const setEditMode = useCallback((id) => {
         setRowModesModel(prev => ({
            ...prev,
            [id]: { mode: GridRowModes.Edit },
        }));
    }, []);

    return {
        rowModesModel,
        setRowModesModel,
        handleEditClick,
        handleSaveClick,
        handleCancelClick,
        setEditMode,
    };
};
