import React from 'react';
import { TextField } from '@mui/material';
import { NumericFormat } from 'react-number-format';

interface CurrencyInputProps {
  value: string | number;
  onChange: (value: string) => void;
  fullWidth?: boolean;
  label?: string;
  sx?: any;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  ...props
}) => {
  return (
    <NumericFormat
      customInput={TextField}
      thousandSeparator=","
      decimalSeparator="."
      prefix="$"
      value={value}
      onValueChange={(values) => {
        onChange(values.value);
      }}
      {...props}
    />
  );
};

export default CurrencyInput;
