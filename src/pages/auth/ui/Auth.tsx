/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from 'react';
import styles from './Auth.module.css';
// import parsePhoneNumber from 'libphonenumber-js';
import { usersApi } from '../../../api/user';
import { useStore } from '../../../stores/globalStore';
import { t } from 'i18next';
import { useSearchParams } from 'react-router-dom';

const VALIDATION_RULES = {
  anyName: /^(?=.*?\p{L})[\p{L}\s-]{1,64}$/u,
  userName: /^(?=.*?[a-zA-Z])[a-zA-Z0-9_]{5,32}$/,
  password:
    /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-+=/\\`:;{}()~[\]"'_<>|,.])[A-Za-z0-9#?!@$%^&*-+=/\\`:;{}()~[\]"'_<>|,.]{8,256}$/,
  phone: /^(?:\+7|8)[0-9]{10}$/,
  email:
    /^(?=^.{1,256}$)(?!.*\.\.)(?!^\.)(?!.*@\.)(?!.*@-)(?!.*\.@)[a-zA-Zа-яА-ЯёЁ0-9._%+-]+@(?!.*-\.)(?!.*\.-)[a-zA-ZёЁа-яА-Я0-9.-]+\.[a-zA-Zа-яА-ЯёЁ]{2,}$/,
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
    let ok = true;

    if (!VALIDATION_RULES.anyName.test(regForm.firstName)) {
      e.firstName = 'Имя - от 1 до 64 символов (буквы, пробелы, дефис)';
      ok = false;
    }
    if (!VALIDATION_RULES.anyName.test(regForm.lastName)) {
      e.lastName = 'Фамилия - от 1 до 64 символов (буквы, пробелы, дефис)';
      ok = false;
    }

    if (!VALIDATION_RULES.userName.test(regForm.userName)) {
      e.userName = 'От 5 до 32 символов: латиница, цифры или _';
      ok = false;
    }

    if (!VALIDATION_RULES.email.test(regForm.email)) {
      e.email = 'Некорректный формат почты';
      ok = false;
    }
    const phoneNumber = parsePhoneNumber(regForm.phone, 'RU');
    if (!phoneNumber) {
      e.phone = 'Некорректный формат телефона';
      ok = false;
    }

    if (!VALIDATION_RULES.password.test(regForm.password)) {
      e.password =
        'Пароль должен быть длиной не менее 8 символов и содержать цифры,' +
        ' латинские заглавные и строчные буквы и один из символов #?!@$%^&*-';
      ok = false;
    }

    if (regForm.password !== regForm.confirmPassword) {
      e.confirmPassword = 'Пароли не совпадают';
      ok = false;
    }

    setRegErrors(e);
    return ok;
  };

  const validateLogin = (): boolean => {
    const e: LoginErrors = { userName: null, password: null };
    let ok = true;

    if (!VALIDATION_RULES.userName.test(loginForm.userName)) {
      e.userName = 'Введите корректное имя пользователя';
      ok = false;
    }

    if (!VALIDATION_RULES.password.test(loginForm.password)) {
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
    console.log('I AM TUTA');
    const valid = isRegister ? validateRegister() : validateLogin();
    if (!valid) return;
    const phoneNumber = parsePhoneNumber(regForm.phone, 'RU');
    console.log('I AM HERE');
    try {
      if (isRegister) {
        await usersApi.register({
          userName: regForm.userName,
          firstName: regForm.firstName,
          lastName: regForm.lastName,
          email: regForm.email,
          password: regForm.password,
          phoneNumber: phoneNumber!.number,
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
              maxLength={32}
            />
            <InputField
              label={t('auth.f_name')}
              value={regForm.firstName}
              onChange={(v) => setRegForm({ ...regForm, firstName: v })}
              error={regErrors.firstName}
              maxLength={64}
            />
            <InputField
              label={t('auth.l_name')}
              value={regForm.lastName}
              onChange={(v) => setRegForm({ ...regForm, lastName: v })}
              error={regErrors.lastName}
              maxLength={64}
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
              maxLength={128}
            />
            <InputField
              label={t('auth.l_conf_pass')}
              value={regForm.confirmPassword}
              onChange={(v) => setRegForm({ ...regForm, confirmPassword: v })}
              error={regErrors.confirmPassword}
              type="password"
              maxLength={128}
            />
          </>
        ) : (
          <>
            <InputField
              label={'Имя пользователя'}
              value={loginForm.userName}
              onChange={(v) => setLoginForm({ ...loginForm, userName: v })}
              error={loginErrors.userName}
              maxLength={32}
            />
            <InputField
              label={t('auth.l_pass')}
              value={loginForm.password}
              onChange={(v) => setLoginForm({ ...loginForm, password: v })}
              error={loginErrors.password}
              type="password"
              maxLength={128}
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
  maxLength?: number;
}

function InputField({
  label,
  value,
  onChange,
  maxLength = 256,
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
        maxLength={maxLength}
      />
      {error && <span className={styles['error-text']}>{error}</span>}
    </div>
  );
}
