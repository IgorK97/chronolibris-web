import { useState } from 'react';
import { usersApi } from '@/api/user';
import axios from 'axios';
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

    if (!form.userName.trim()) {
      e.userName = 'Введите имя пользователя';
      ok = false;
    } else if (form.userName.trim().length < 3) {
      e.userName = 'Минимум 3 символа';
      ok = false;
    }

    if (!form.email.trim()) {
      e.email = 'Введите email';
      ok = false;
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      e.email = 'Некорректный email';
      ok = false;
    }
    if (!form.phoneNumber.trim()) {
      e.phoneNumber = 'Введите номер телефона';
      ok = false;
    } else if (!/^(\+7|8)?[0-9]{10}$/.test(form.phoneNumber)) {
      e.phoneNumber = 'Некорректный номер';
      ok = false;
    }

    if (!form.password) {
      e.password = 'Введите пароль';
      ok = false;
    } else if (form.password.length < 6) {
      e.password = 'Минимум 6 символов';
      ok = false;
    }

    if (form.password !== form.confirm) {
      e.confirm = 'Пароли не совпадают';
      ok = false;
    }

    setErrors(e);
    return ok;
  };

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
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message ?? 'Ошибка при регистрации.';

        // Показываем серверные ошибки уникальности под нужным полем
        if (msg.toLowerCase().includes('имя пользователя')) {
          setErrors((prev) => ({ ...prev, username: msg }));
        } else if (msg.toLowerCase().includes('email')) {
          setErrors((prev) => ({ ...prev, email: msg }));
        } else if (msg.toLowerCase().includes('телефон')) {
          setErrors((prev) => ({ ...prev, phone: msg }));
        } else {
          setServerError(msg);
        }
      } else {
        setServerError('Произошла непредвиденная ошибка.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Регистрация сотрудника</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Роль */}
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

        {/* Username */}
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

        {/* Email */}
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
        />

        {/* Телефон */}
        <Field
          label="Телефон"
          type="tel"
          value={form.phoneNumber}
          onChange={set('phoneNumber')}
          error={errors.phoneNumber}
        />

        {/* Пароль */}
        <Field
          label="Пароль"
          type="password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
        />

        {/* Подтверждение */}
        <Field
          label="Подтвердите пароль"
          type="password"
          value={form.confirm}
          onChange={set('confirm')}
          error={errors.confirm}
        />

        {serverError && <p className={styles.serverError}>{serverError}</p>}

        {success && <p className={styles.successMsg}>{success}</p>}

        <button
          type="submit"
          className={styles['submit-btn']}
          disabled={loading}
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
  onChange,
  error,
  type = 'text',
}: {
  label: string;
  value: string;
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
      />
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}
