/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from 'react';
import styles from './Auth.module.css';

import { usersApi } from '../../../api/user';
import { useStore } from '../../../stores/globalStore';
import { t } from 'i18next';
import { useSearchParams } from 'react-router-dom';

const VALIDATION_RULES = {
  userName: /^[a-zA-Z0-9_]{5,256}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^(?:\+7|8)[0-9]{7,14}$/,
  password: /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,128}$/,
};

interface RegisterForm {
  userName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  lastName: string;
  firstName: string;
}
interface LoginForm {
  userName: string;
  password: string;
}

interface RegisterErrors {
  userName: string | null;
  email: string | null;
  phone: string | null;
  password: string | null;
  confirmPassword: string | null;
  firstName: string | null;
  lastName: string | null;
}

interface LoginErrors {
  userName: string | null;
  password: string | null;
}

interface AuthProps {
  onNavigate: () => void;
}

export const Auth = ({ onNavigate }: AuthProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isRegister = searchParams.get('mode') === 'register';

  const setIsRegister = (value: boolean) => {
    setSearchParams({ mode: value ? 'register' : 'login' });
    setServerError(null);
  };

  const { setUser } = useStore();

  const [regForm, setRegForm] = useState<RegisterForm>({
    userName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    lastName: '',
    firstName: '',
  });

  const [regErrors, setRegErrors] = useState<RegisterErrors>({
    userName: null,
    email: null,
    phone: null,
    password: null,
    confirmPassword: null,
    firstName: null,
    lastName: null,
  });

  const [loginForm, setLoginForm] = useState<LoginForm>({
    userName: '',
    password: '',
  });

  const [loginErrors, setLoginErrors] = useState<LoginErrors>({
    userName: null,
    password: null,
  });

  const [serverError, setServerError] = useState<string | null>(null);

  const validateRegister = (): boolean => {
    const e: RegisterErrors = {
      userName: null,
      email: null,
      phone: null,
      password: null,
      confirmPassword: null,
      firstName: null,
      lastName: null,
    };
    if (!regForm.firstName.trim()) e.firstName = 'Имя не может быть пустым';
    if (!regForm.lastName.trim()) e.lastName = 'Фамилия не может быть пустой';

    if (!VALIDATION_RULES.userName.test(regForm.userName)) {
      e.userName = 'Минимум 5 симвоолов: латиница, цифры или _';
    }

    if (!VALIDATION_RULES.email.test(regForm.email)) {
      e.email = 'Некорректный формат почты';
    }

    if (!VALIDATION_RULES.phone.test(regForm.phone)) {
      e.phone = 'Некорректный формат телефона';
    }

    if (!VALIDATION_RULES.password.test(regForm.password)) {
      e.password =
        'Пароль должен быть длиной не менее 8 символов и содержать цифры,' +
        ' латинские заглавные и строчные буквы и один из символов #?!@$%^&*-';
    }

    if (regForm.password !== regForm.confirmPassword) {
      e.confirmPassword = 'Пароли не совпадают';
    }

    setRegErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateLogin = (): boolean => {
    const e: LoginErrors = { userName: null, password: null };
    let ok = true;

    if (!loginForm.userName.trim() || loginForm.userName.length < 5) {
      e.userName = 'Введите имя пользователя';
      ok = false;
    }

    if (!loginForm.password.trim() || loginForm.password.length < 8) {
      e.password = t('auth.error_pass');
      ok = false;
    }
    setLoginErrors(e);
    return ok;
  };

  useEffect(() => {
    if (isRegister) validateRegister();
    else validateLogin();
  }, [loginForm, regForm, isRegister]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const valid = isRegister ? validateRegister() : validateLogin();
    if (!valid) return;

    try {
      if (isRegister) {
        await usersApi.register({
          userName: regForm.userName,
          firstName: regForm.firstName,
          lastName: regForm.lastName,
          email: regForm.email,
          password: regForm.password,
          phoneNumber: regForm.phone,
        });
      } else {
        await usersApi.login(loginForm.userName, loginForm.password);
      }
      const resProfile = await usersApi.getProfile();
      setUser(resProfile);
      onNavigate();
    } catch (e: any) {
      setServerError(`Ошибка: ${e.response.data?.detail}`);
    }
  };

  return (
    <div className={styles['container']}>
      <h1 className={styles['giant-title']}>
        {isRegister ? t('auth.alert_title_reg') : t('auth.alert_title_auth')}
      </h1>

      <form onSubmit={handleSubmit}>
        {isRegister ? (
          <>
            <InputField
              label={t('auth.u_name')}
              value={regForm.userName}
              onChange={(v) => setRegForm({ ...regForm, userName: v })}
              error={regErrors.userName}
            />
            <InputField
              label={t('auth.f_name')}
              value={regForm.firstName}
              onChange={(v) => setRegForm({ ...regForm, firstName: v })}
              error={regErrors.firstName}
            />
            <InputField
              label={t('auth.l_name')}
              value={regForm.lastName}
              onChange={(v) => setRegForm({ ...regForm, lastName: v })}
              error={regErrors.lastName}
            />
            <InputField
              label={t('auth.l_email')}
              value={regForm.email}
              onChange={(v) => setRegForm({ ...regForm, email: v })}
              error={regErrors.email}
              type="email"
            />
            <InputField
              label={t('auth.l_phone')}
              value={regForm.phone}
              onChange={(v) => setRegForm({ ...regForm, phone: v })}
              error={regErrors.phone}
              type="tel"
            />
            <InputField
              label={t('auth.l_pass')}
              value={regForm.password}
              onChange={(v) => setRegForm({ ...regForm, password: v })}
              error={regErrors.password}
              type="password"
            />
            <InputField
              label={t('auth.l_conf_pass')}
              value={regForm.confirmPassword}
              onChange={(v) => setRegForm({ ...regForm, confirmPassword: v })}
              error={regErrors.confirmPassword}
              type="password"
            />
          </>
        ) : (
          <>
            <InputField
              label={t('auth.l_name')}
              value={loginForm.userName}
              onChange={(v) => setLoginForm({ ...loginForm, userName: v })}
              error={loginErrors.userName}
            />
            <InputField
              label={t('auth.l_pass')}
              value={loginForm.password}
              onChange={(v) => setLoginForm({ ...loginForm, password: v })}
              error={loginErrors.password}
              type="password"
            />
          </>
        )}

        {serverError && <p className={styles['server-error']}>{serverError}</p>}

        <button type="submit" className={styles['button']}>
          {isRegister ? t('auth.action_reg') : t('auth.action_auth')}
        </button>
      </form>

      <button
        className={styles['switch-button']}
        onClick={() => setIsRegister(!isRegister)}
      >
        {isRegister ? t('auth.switch_to_auth') : t('auth.switch_to_reg')}
      </button>
    </div>
  );
};

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  type?: string;
}

function InputField({
  label,
  value,
  onChange,
  error,
  type = 'text',
}: InputFieldProps) {
  return (
    <div className={styles['input-container']}>
      <label className={styles['label']}>{label}</label>
      <input
        type={type}
        className={`${styles['input']} ${error ? styles['error-input'] : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
      />
      {error && <span className={styles['error-text']}>{error}</span>}
    </div>
  );
}
