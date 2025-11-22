import TextField from '@mui/material/TextField';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';

const filterOptions = createFilterOptions({
    matchFrom: 'any',
    stringify: (option) => option?.name ?? "",
});

export default function UserFilter({ label = "", options = [], value = null, onChange }) {
    const handleChange = (_, newValue) => {
        onChange?.(newValue ?? null);
    };

    return (
        <div className="flex items-center gap-8 p-20">
            {label ? <span className="font-poppins">{label}</span> : null}
            <Autocomplete
                options={options}
                value={value}
                onChange={handleChange}
                getOptionLabel={(option) => option?.name ?? ""}
                filterOptions={filterOptions}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                sx={{
                    '& .MuiOutlinedInput-notchedOutline, & .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline, & .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid #e5e7eb',
                    },
                    width: "50%",
                }}
                renderInput={(params) => <TextField {...params} label="" size="small" />}
            />
        </div>
    )
}