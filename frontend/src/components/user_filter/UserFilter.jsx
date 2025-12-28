import React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';

const filterOptions = createFilterOptions({
    matchFrom: 'any',
    stringify: (option) => option?.name ?? "",
});

export default function UserFilter({
    label = "",
    options = [],
    value = null,
    onChange,
    placeholder = "Selecione...",
    containerClassName,
    inputWidth = 300,
}) {
    const handleChange = (_, newValue) => {
        onChange?.(newValue ?? null);
    };

    const wrapperClasses = `flex items-center gap-8 ${containerClassName ?? "px-8 py-6 md:px-12 md:py-8"}`;
    const resolvedWidth = typeof inputWidth === "number" ? `${inputWidth}px` : inputWidth;

    return (
        <div className={wrapperClasses}>
            {label ? <span className="font-poppins text-gray-700 font-medium">{label}</span> : null}
            <Autocomplete
                options={options}
                value={value}
                onChange={handleChange}
                getOptionLabel={(option) => option?.name ?? ""}
                filterOptions={filterOptions}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                sx={{
                    '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #e5e7eb' },
                    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { border: '1px solid #9ca3af' },
                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { border: '1px solid #5A44B0' },
                    width: resolvedWidth,
                    backgroundColor: "white",
                    borderRadius: "8px"
                }}
                renderInput={(params) => <TextField {...params} label="" size="small" placeholder={placeholder} />}
            />
        </div>
    )
}