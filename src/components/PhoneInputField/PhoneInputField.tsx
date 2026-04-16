import styles from '@pages/Auth/ui/Auth.module.css';
import { PatternFormat } from 'react-number-format';
interface PhoneInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
}
export function PhoneInputField({
  label,
  value,
  onChange,
  error,
}: PhoneInputProps) {
  const format = '+7 ### ### ## ##';

  return (
    <div className={styles['input-container']}>
      <label className={styles['label']}>{label}</label>
      <PatternFormat
        format={format}
        allowEmptyFormatting
        mask="_"
        className={`${styles['input']} ${error ? styles['error-input'] : ''}`}
        value={value}
        onValueChange={(value) => {
          onChange(value.value);
        }}
        placeholder={label}
      />
      {error && <span className={styles['error-text']}>{error}</span>}
    </div>
  );
}
