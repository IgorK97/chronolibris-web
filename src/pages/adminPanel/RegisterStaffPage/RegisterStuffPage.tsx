/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { usersApi } from '@/api/user';
import styles from './RegisterStuffPage.module.css';
import { PhoneInputField } from '@/components/PhoneInputField/PhoneInputField';

type StaffRole = 'moderator' | 'admin';

interface FormState {
  userName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirm: string;
  role: StaffRole;
  lastName: string;
  firstName: string;
}

interface FormErrors {
  userName: string | null;
  email: string | null;
  phoneNumber: string | null;
  password: string | null;
  confirm: string | null;
  lastName: string | null;
  firstName: string | null;
}

const EMPTY_FORM: FormState = {
  userName: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirm: '',
  role: 'moderator',
  lastName: '',
  firstName: '',
};

const EMPTY_ERRORS: FormErrors = {
  userName: null,
  email: null,
  phoneNumber: null,
  password: null,
  confirm: null,
  lastName: null,
  firstName: null,
};

const VALIDATION_RULES = {
  anyName: /^(?=.*?\p{L})[\p{L}\s-]{1,64}$/u,
  userName: /^(?=.*?[a-zA-Z])[a-zA-Z0-9_]{5,32}$/,
  password:
    /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-+=/\\`:;{}()~[\]"'_<>|,.])[A-Za-z0-9#?!@$%^&*-+=/\\`:;{}()~[\]"'_<>|,.]{8,256}$/,
  phone: /^(?:\+7|8)[0-9]{10}$/,
  email:
    /^(?=^.{1,254}$)(?!.*\.\.)(?!^\.)(?!.*@\.)(?!.*@-)(?!.*\.@)[a-zA-Z0-9._%+-]+@(?!.*-\.)(?!.*\.-)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
};

export function RegisterStaffPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>(EMPTY_ERRORS);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = (): boolean => {
    const e = { ...EMPTY_ERRORS };
    let ok = true;
    if (!VALIDATION_RULES.anyName.test(form.firstName)) {
      e.firstName = 'Имя - от 1 до 64 символов (буквы, пробелы, дефис)';
      ok = false;
    }
    if (!VALIDATION_RULES.anyName.test(form.lastName)) {
      e.lastName = 'Фамилия - от 1 до 64 символов (буквы, пробелы, дефис)';
      ok = false;
    }

    if (!VALIDATION_RULES.userName.test(form.userName)) {
      e.userName = 'Минимум 5 симвоолов: латиница, цифры или _';
      ok = false;
    }

    if (!VALIDATION_RULES.email.test(form.email)) {
      e.email = 'Некорректный формат почты';
      ok = false;
    }

    if (!VALIDATION_RULES.phone.test(`+7` + form.phoneNumber)) {
      e.phoneNumber = 'Некорректный формат телефона';
      ok = false;
    }

    if (!VALIDATION_RULES.password.test(form.password)) {
      e.password =
        'Пароль должен быть длиной не менее 8 символов и содержать цифры,' +
        ' латинские заглавные и строчные буквы и один из символов #?!@$%^&*-';
      ok = false;
    }

    if (form.password !== form.confirm) {
      e.confirm = 'Пароли не совпадают';
      ok = false;
    }

    setErrors(e);
    return ok;
  };

  useEffect(() => {
    validate();
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccess(null);

    if (!validate()) return;

    setLoading(true);
    try {
      await usersApi.registerStaff({
        userName: form.userName.trim(),
        email: form.email.trim(),
        phoneNumber: `+7` + form.phoneNumber.trim(),
        password: form.password,
        role: form.role,
        lastName: form.lastName,
        firstName: form.firstName,
      });

      setSuccess(
        `${form.role === 'admin' ? 'Администратор' : 'Модератор'} «${form.userName}» успешно зарегистрирован.`
      );
      // setForm(EMPTY_FORM);
      setErrors(EMPTY_ERRORS);
    } catch (err: any) {
      setServerError(`Ошибка: ${err.response.data?.detail}`);
    } finally {
      setLoading(false);
    }
  };

  const isValid = useMemo(() => {
    return validate();
  }, [form]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Регистрация сотрудника</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>Роль</label>
          <select
            className={styles.select}
            value={form.role}
            onChange={set('role')}
          >
            <option value="Moderator">Модератор</option>
            <option value="Admin">Администратор</option>
          </select>
        </div>

        <Field
          label="Имя пользователя"
          value={form.userName}
          onChange={set('userName')}
          error={errors.userName}
        />

        <Field
          label="Имя"
          value={form.firstName}
          onChange={set('firstName')}
          error={errors.firstName}
        />

        <Field
          label="Фамилия"
          value={form.lastName}
          onChange={set('lastName')}
          error={errors.lastName}
        />

        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
        />

        {/* <Field
          label="Телефон"
          type="tel"
          value={form.phoneNumber}
          onChange={set('phoneNumber')}
          error={errors.phoneNumber}
        /> */}
        <PhoneInputField
          label={'Телефон'}
          value={form.phoneNumber}
          onChange={(v) => setForm({ ...form, phoneNumber: v })}
          error={errors.phoneNumber}
        />
        <Field
          label="Пароль"
          type="password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          maxLength={128}
        />

        <Field
          label="Подтвердите пароль"
          type="password"
          value={form.confirm}
          onChange={set('confirm')}
          error={errors.confirm}
          maxLength={128}
        />

        {serverError && <p className={styles['server-error']}>{serverError}</p>}

        {success && <p className={styles['success-msg']}>{success}</p>}

        <button
          type="submit"
          className={styles['submit-btn']}
          disabled={loading || !isValid}
        >
          {loading ? 'Регистрация...' : 'Зарегистрировать'}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  maxLength = 256,
  onChange,
  error,
  type = 'text',
}: {
  label: string;
  value: string;
  maxLength?: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: string | null;
  type?: string;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input
        type={type}
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        value={value}
        onChange={onChange}
        placeholder={label}
        maxLength={maxLength}
      />
      {error && <span className={styles['error-text']}>{error}</span>}
    </div>
  );
}
