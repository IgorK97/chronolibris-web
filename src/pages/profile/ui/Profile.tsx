/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './Profile.module.css';
// import parsePhoneNumber from 'libphonenumber-js';
import { useStore } from '../../../stores/globalStore';
import { usersApi } from '@api/user';
import { PhoneInputField } from '@/components/PhoneInputField/PhoneInputField';

const VALIDATION_RULES = {
  anyName: /^(?=.*?\p{L})[\p{L}\s-]{1,64}$/u,
  userName: /^(?=.*?[a-zA-Z])[a-zA-Z0-9_]{5,32}$/,
  password:
    /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-+=/\\`:;{}()~[\]"'_<>|,.])[A-Za-z0-9#?!@$%^&*-+=/\\`:;{}()~[\]"'_<>|,.]{8,256}$/,
  phone: /^(?:\+7|8)[0-9]{10}$/,
  email:
    /^(?=^.{1,254}$)(?!.*\.\.)(?!^\.)(?!.*@\.)(?!.*@-)(?!.*\.@)[a-zA-Z0-9._%+-]+@(?!.*-\.)(?!.*\.-)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
};

interface ProfileProps {
  onNavigate: () => void;
}

export const Profile = ({ onNavigate }: ProfileProps) => {
  const { user, setUser, clearStore } = useStore();
  const { t } = useTranslation();

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phoneNumber: (user?.phoneNumber ?? '').slice(2) || '',
    email: user?.email || '',
    userName: user?.userName || '',
  });

  const [profileSnapshot, setProfileSnapshot] = useState({ ...profileForm });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {}
  );
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [passwordError, setPasswordError] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const validateProfile = (data: typeof profileForm) => {
    const newErrors: Record<string, string> = {};

    if (!VALIDATION_RULES.anyName.test(profileForm.firstName)) {
      newErrors.firstName = 'Имя - от 1 до 64 символов (буквы, пробелы, дефис)';
    }
    if (!VALIDATION_RULES.anyName.test(profileForm.lastName)) {
      newErrors.lastName =
        'Фамилия - от 1 до 64 символов (буквы, пробелы, дефис)';
    }

    if (!VALIDATION_RULES.userName.test(profileForm.userName)) {
      newErrors.userName = 'От 5 до 32 символов: латиница, цифры или _';
    }

    if (!VALIDATION_RULES.email.test(data.email)) {
      newErrors.email = 'Некорректный формат почты';
    }

    // const phoneNumber = parsePhoneNumber(profileForm.phoneNumber, 'RU');
    if (!VALIDATION_RULES.phone.test(`+7` + data.phoneNumber)) {
      newErrors.phone = 'Некорректный формат телефона';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const validatePasswords = () => {
    const newErrors: Record<string, string> = {};
    if (!VALIDATION_RULES.password.test(newPassword)) {
      newErrors.newPassword =
        'Пароль должен быть длиной не менее 8 символов и содержать цифры,' +
        ' латинские заглавные и строчные буквы и один из символов #?!@$%^&*-';
    }

    if (newPassword && newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    if (currentPassword.trim().length < 8) {
      newErrors.currentPassword = 'Текущий пароль должен быть указан';
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  useEffect(() => {
    validateProfile(profileForm);
  }, [profileForm]);

  useEffect(() => {
    validatePasswords();
  }, [currentPassword, newPassword, confirmPassword]);

  const profileChanged = useMemo(() => {
    return JSON.stringify(profileForm) !== JSON.stringify(profileSnapshot);
  }, [profileForm, profileSnapshot]);

  const isProfileValid = Object.keys(errors).length === 0;

  const passwordReady = Object.keys(passwordErrors).length === 0;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await usersApi.getProfile();
        setUser(profile);
        const initial = {
          firstName: profile.firstName ?? '',
          lastName: profile.lastName ?? '',
          userName: profile.userName ?? '',
          email: profile.email ?? '',
          phoneNumber: (profile.phoneNumber ?? '').slice(2) ?? '',
        };
        setProfileForm(initial);
        setProfileSnapshot(initial);
      } catch (e: any) {
        setProfileError(`Ошибка: ${e.response.data?.detail}. Попробуйте снова`);
        setProfileSuccess(false);
      }
    };
    loadProfile();
  }, [setUser]);

  const logout = () => {
    clearStore();
    onNavigate();
  };

  const handleSaveProfile = async (e?: FormEvent) => {
    e?.preventDefault();
    // console.log(profileChanged);

    if (!user || !profileChanged || !validateProfile(profileForm)) return;
    // console.log('I AM HERE~~~');
    try {
      setProfileSuccess(false);
      const updatedProfile = await usersApi.updateProfile({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        phoneNumber: `+7` + profileForm.phoneNumber,
        userName: profileForm.userName,
      });
      setUser({
        ...user,
        ...updatedProfile,
      });
      setProfileSuccess(true);
      setProfileSnapshot({ ...profileForm });
      // const queryClient = useQueryClient();
      // queryClient.invalidateQueries();
    } catch (e: any) {
      setProfileError(`Ошибка: ${e.response.data?.detail}. Попробуйте снова`);
    }
  };

  const handleChangePassword = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!user || !validatePasswords()) return;
    setPasswordError('');
    setPasswordSuccess(false);

    try {
      await usersApi.changePassword({
        currentPassword: currentPassword,
        newPassword: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(true);
    } catch (e: any) {
      setPasswordError(
        `Не удалось сменить пароль: ${e.response.data?.detail}. Попробуйте снова`
      );
    }
  };

  return (
    <div className={styles['container']}>
      <div className={styles['scroll-container']}>
        <section className={styles['profile-section']}>
          <div className={styles['avatar']}>
            <User size={24} color="#9ca3af" />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 500 }}>
              {user ? user.userName : t('profile.guest')}
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
              {user ? user.email : ''}
            </p>
          </div>
        </section>

        <form className={styles['section']} onSubmit={handleSaveProfile}>
          <h3 className={styles['section-title']}>
            {t('profile.label_settings')}
          </h3>
          <div className={styles['form']}>
            <div className={styles['input-group']}>
              <label className={styles['label']}>Имя</label>
              <input
                className={styles['text-input']}
                value={profileForm.firstName}
                maxLength={256}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, firstName: e.target.value })
                }
                placeholder={'имя'}
              />
              {errors.firstName && (
                <span className={styles['error-msg']}>{errors.firstName}</span>
              )}
            </div>

            <div className={styles['input-group']}>
              <label className={styles['label']}>Фамилия</label>
              <input
                className={styles['text-input']}
                value={profileForm.lastName}
                maxLength={256}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, lastName: e.target.value })
                }
                placeholder={'фамилия'}
              />
              {errors.lastName && (
                <span className={styles['error-msg']}>{errors.lastName}</span>
              )}
            </div>

            <div className={styles['input-group']}>
              <label className={styles['label']}>Имя пользователя</label>
              <input
                className={styles['text-input']}
                value={profileForm.userName}
                maxLength={256}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, userName: e.target.value })
                }
                placeholder={t('profile.ph_name')}
              />
              {errors.userName && (
                <span className={styles['error-msg']}>{errors.userName}</span>
              )}
            </div>

            <div className={styles['input-group']}>
              <label className={styles['label']}>
                {t('profile.label_email')}
              </label>
              <input
                type="email"
                className={styles['text-input']}
                value={profileForm.email}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, email: e.target.value })
                }
                placeholder={t('profile.ph_email')}
              />
              {errors.email && (
                <span className={styles['error-msg']}>{errors.email}</span>
              )}
            </div>

            <PhoneInputField
              label={'Телефон'}
              value={profileForm.phoneNumber}
              onChange={(v) =>
                setProfileForm({ ...profileForm, phoneNumber: v })
              }
              error={errors.phone}
            />
          </div>
          {profileSuccess && (
            <p className={styles['success-msg']}>Данные сохранены</p>
          )}
          {profileError && (
            <p className={styles['error-msg']}>{profileError}</p>
          )}
          <button
            type="submit"
            className={styles['save-button-bottom']}
            // onClick={handleSaveProfile}
            disabled={!profileChanged || !isProfileValid}
          >
            {t('profile.save')}
          </button>
        </form>

        <form className={styles['section']} onSubmit={handleChangePassword}>
          <h3 className={styles['section-title']}>
            {t('profile.label_security')}
          </h3>

          <div className={styles['form']}>
            <div className={styles['input-group']}>
              <label className={styles['label']}>
                {t('profile.label_pass')}
              </label>
              <input
                type="password"
                className={styles['text-input']}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('profile.ph_pass')}
                autoComplete="new-password"
              />
              {newPassword && passwordErrors.currentPassword && (
                <span className={styles['error-msg']}>
                  {passwordErrors.currentPassword}
                </span>
              )}
            </div>

            <div className={styles['input-group']}>
              <label className={styles['label']}>
                {t('profile.label_new_pass')}
              </label>
              <input
                type="password"
                className={styles['text-input']}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('profile.ph_new_pass')}
                autoComplete="new-password"
                maxLength={128}
              />
              {newPassword && passwordErrors.newPassword && (
                <span className={styles['error-msg']}>
                  {passwordErrors.newPassword}
                </span>
              )}
            </div>

            <div className={styles['input-group']}>
              <label className={styles['label']}>
                {t('profile.label_conf_pass')}
              </label>
              <input
                type="password"
                className={styles['text-input']}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('profile.ph_conf_pass')}
              />

              {newPassword && passwordErrors.confirmPassword && (
                <p className={styles['error-msg']}>
                  {passwordErrors.confirmPassword}
                </p>
              )}
            </div>
            {passwordError && (
              <p className={styles['error-msg']}>{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className={styles['success-msg']}>Пароль изменён</p>
            )}
          </div>
          <button
            type="submit"
            className={styles['save-button-bottom']}
            // onClick={handleChangePassword}
            disabled={!passwordReady}
          >
            Изменить пароль
          </button>
          <div className={styles['section']}>
            <button
              className={styles['row']}
              onClick={() => (user ? logout() : onNavigate())}
            >
              <span style={{ color: '#D32F2F', fontWeight: 500 }}>
                {user ? t('profile.exit') : t('profile.enter')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
