import { Autocomplete, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export default function SkuAutocomplete({ value, onChange, options = [], placeholder = 'Procurar SKU' }) {
  return (
    <div className="w-full">
      <Autocomplete
        size="small"
        options={options}
        getOptionLabel={(option) => (typeof option === 'string' ? option : option?.label || '')}
        isOptionEqualToValue={(option, val) => option?.value === val?.value}
        value={value}
        onChange={(_, newVal) => onChange && onChange(newVal)}
        sx={{ width: '100%' }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            variant="outlined"
            fullWidth
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="medium" />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
                backgroundColor: '#F6F6F6'
              },
              '& .MuiInputBase-input': { padding: '10px 12px' }
            }}
          />
        )}
      />
    </div>
  );
}
