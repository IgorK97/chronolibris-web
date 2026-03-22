import React, { useState } from 'react';
import styles from './Auth.module.css';

// Shared imports - adjust paths to your web project
import { usersApi } from '../../../api/user';
import { useStore } from '../../../stores/globalStore';
import { t } from 'i18next';
import axios from 'axios';
// import { Button } from "@/components/ui/button";
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
  const [isRegister, setIsRegister] = useState(false);

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

    if (!regForm.userName.trim()) {
      e.userName = t('auth.error_name');
      ok = false;
    } else if (regForm.userName.trim().length < 3) {
      e.userName = 'Имя пользователя должно быть не менее 3 символов';
      ok = false;
    }

    if (regForm.email.trim() && !/\S+@\S+\.\S+/.test(regForm.email)) {
      e.email = t('auth.incorr_email');
      ok = false;
    }

    if (regForm.phone.trim() && !/^(\+7|8)?[0-9]{10}$/.test(regForm.phone)) {
      e.phone = t('auth.error_phone');
      ok = false;
    }

    if (!regForm.password.trim()) {
      e.password = t('auth.error_pass');
      ok = false;
    } else if (regForm.password.length < 8) {
      e.password = t('auth.short_pass');
      ok = false;
    }

    if (regForm.password !== regForm.confirmPassword) {
      e.confirmPassword = t('auth.error_conf_pass');
      ok = false;
    }
    setRegErrors(e);
    return ok;
  };

  const validateLogin = (): boolean => {
    const e: LoginErrors = { userName: null, password: null };
    let ok = true;

    if (!loginForm.userName.trim()) {
      e.userName = 'Введите имя пользователя';
      ok = false;
    }

    if (!loginForm.password.trim()) {
      e.password = t('auth.error_pass');
      ok = false;
    }
    setLoginErrors(e);
    return ok;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload on form submit
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
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const serverMessage = e.response?.data?.message;
        console.log('TUTU!!! Server error:', serverMessage || e.message);
        alert(
          serverMessage ||
            'Authentication error. Please check your credentials and try again.'
        );
        return;
      } else {
        alert(`An unexpected error ${e} occurred. Please try again later.`);
      }
      console.error('Auth error:', e);
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
        onClick={() => {
          setIsRegister(!isRegister);
          setServerError(null);
        }}
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
