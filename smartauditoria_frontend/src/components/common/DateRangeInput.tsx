import React from 'react';
import { TextField, Box, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

interface DateRangeInputProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  startLabel?: string;
  endLabel?: string;
  error?: string;
}

const DateRangeInput: React.FC<DateRangeInputProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startLabel = 'Fecha de Inicio',
  endLabel = 'Fecha de Finalizacion',
  error
}) => {
  const isEndDateBeforeStart = startDate && endDate && endDate < startDate;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box>
        <Box display="flex" gap={2} flexWrap="wrap">
          <DatePicker
            label={startLabel}
            value={startDate}
            onChange={onStartDateChange}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!isEndDateBeforeStart,
                helperText: isEndDateBeforeStart ? 'La fecha de inicio no puede ser mayor a la final' : '',
                sx: { borderRadius: '12px' }
              }
            }}
          />
          <DatePicker
            label={endLabel}
            value={endDate}
            onChange={onEndDateChange}
            minDate={startDate || undefined}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!isEndDateBeforeStart,
                helperText: isEndDateBeforeStart ? 'La fecha de finalizacion debe ser posterior a la de inicio' : '',
                sx: { borderRadius: '12px' }
              }
            }}
          />
        </Box>
        {error && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
            {error}
          </Typography>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default DateRangeInput;








