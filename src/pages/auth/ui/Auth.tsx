import React, { useState } from 'react';
import styles from './Auth.module.css';

// Shared imports - adjust paths to your web project
import { usersApi } from '../../../api/user';
import { useStore } from '../../../stores/globalStore';
import { t } from 'i18next';
import axios from 'axios';
// import { Button } from "@/components/ui/button";

interface MyError {
  username: string | null;
  email: string | null;
  fullName: string | null;
  password: string | null;
  confirmPassword: string | null;
  phone: string | null;
}

interface FormValues {
  username: string;
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

interface AuthProps {
  onNavigate: () => void;
}

export const Auth = ({ onNavigate }: AuthProps) => {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState<FormValues>({
    username: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [errors, setErrors] = useState<MyError>({
    confirmPassword: null,
    email: null,
    fullName: null,
    password: null,
    phone: null,
    username: null,
  });

  const { setUser } = useStore();

  const handleChange = (field: keyof FormValues, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const validateForm = () => {
    let valid = true;
    const newErrors: MyError = {
      confirmPassword: null,
      email: null,
      fullName: null,
      password: null,
      phone: null,
      username: null,
    };

    if (isRegister && !form.username.trim()) {
      newErrors.username = 'auth.error_name';
      valid = false;
    }
    if (!form.email.trim()) {
      newErrors.email = 'auth.error_email';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'auth.incorr_email';
      valid = false;
    }
    if (isRegister && !form.fullName.trim()) {
      newErrors.fullName = 'auth.error_fullname';
      valid = false;
    }
    if (!form.password.trim()) {
      newErrors.password = 'auth.error_pass';
      valid = false;
    } else if (form.password.length < 6) {
      newErrors.password = 'auth.short_pass';
      valid = false;
    }
    if (isRegister && form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'auth.error_conf_pass';
      valid = false;
    }
    if (isRegister && !/^(\+7|8)?[0-9]{10}$/.test(form.phone)) {
      newErrors.phone = 'auth.error_phone';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload on form submit
    if (!validateForm()) return;

    try {
      if (isRegister) {
        await usersApi.register({
          name: form.username,
          familyName: form.fullName,
          email: form.email,
          password: form.password,
        });

        alert('Registration successful!');

        // if (!res.success) {
        //   alert(res.message || "Registration failed");
        //   return;
        // }

        // alert(res.message || "Registration successful");
        // const resProfile = await usersApi.getProfile();
        // setUser(resProfile);
        // onNavigate();
      } else {
        console.log('Attempting login with', form.email);
        await usersApi.login(form.email, form.password);
        // await usersApi.getProfile(); // Ensure cookie is set before fetching profile
        // if (!res.success) {
        //   alert(res.message || "Login failed");
        //   return;
        // }

        alert('Login successful');
        // const resProfile = await usersApi.getProfile();
        // setUser(resProfile);
        // onNavigate();
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
        {isRegister && (
          <>
            <InputField
              label={t('auth.l_name')}
              value={form.username}
              onChange={(v) => handleChange('username', v)}
              error={errors.username}
            />
            <InputField
              label={t('auth.l_fullname')}
              value={form.fullName}
              onChange={(v) => handleChange('fullName', v)}
              error={errors.fullName}
            />
            <InputField
              label={t('auth.l_phone')}
              value={form.phone}
              onChange={(v) => handleChange('phone', v)}
              error={errors.phone}
              type="tel"
            />
          </>
        )}

        <InputField
          label={t('auth.l_email')}
          value={form.email}
          onChange={(v) => handleChange('email', v)}
          error={errors.email}
          type="email"
        />

        <InputField
          label={t('auth.l_pass')}
          value={form.password}
          onChange={(v) => handleChange('password', v)}
          error={errors.password}
          type="password"
        />
        {/* <div className="tw:p-10 tw:bg-red-500 tw:text-white tw:font-bold">
          Если я на красном фоне — префикс работает!
        </div>

        <div className="p-10 bg-blue-500">
          А я должен быть обычным текстом без фона, потому что у меня нет
          префикса.
        </div>
        <Button variant="outline">Я с префиксом!</Button> */}

        {isRegister && (
          <InputField
            label={t('auth.l_conf_pass')}
            value={form.confirmPassword}
            onChange={(v) => handleChange('confirmPassword', v)}
            error={errors.confirmPassword}
            type="password"
          />
        )}

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
