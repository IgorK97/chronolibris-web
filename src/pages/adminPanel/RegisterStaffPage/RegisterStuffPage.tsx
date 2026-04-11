/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { usersApi } from '@/api/user';
import styles from './RegisterStuffPage.module.css';

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
  userName: /^[a-zA-Z0-9_]{5,256}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^(?:\+7|8)[0-9]{7,14}$/,
  password: /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,128}$/,
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

    if (!form.firstName.trim()) e.firstName = 'Имя не может быть пустым';
    if (!form.lastName.trim()) e.lastName = 'Фамилия не может быть пустой';

    if (!VALIDATION_RULES.userName.test(form.userName)) {
      e.userName = 'Минимум 5 симвоолов: латиница, цифры или _';
    }

    if (!VALIDATION_RULES.email.test(form.email)) {
      e.email = 'Некорректный формат почты';
    }

    if (!VALIDATION_RULES.phone.test(form.phoneNumber)) {
      e.phoneNumber = 'Некорректный формат телефона';
    }

    if (!VALIDATION_RULES.password.test(form.password)) {
      e.password =
        'Пароль должен быть длиной не менее 8 символов и содержать цифры,' +
        ' латинские заглавные и строчные буквы и один из символов #?!@$%^&*-';
    }

    if (form.password !== form.confirm) {
      e.confirm = 'Пароли не совпадают';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
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
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
        role: form.role,
        lastName: form.lastName,
        firstName: form.firstName,
      });

      setSuccess(
        `${form.role === 'admin' ? 'Администратор' : 'Модератор'} «${form.userName}» успешно зарегистрирован.`
      );
      setForm(EMPTY_FORM);
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

        <Field
          label="Телефон"
          type="tel"
          value={form.phoneNumber}
          onChange={set('phoneNumber')}
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

        {serverError && <p className={styles.serverError}>{serverError}</p>}

        {success && <p className={styles.successMsg}>{success}</p>}

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
