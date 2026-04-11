/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './Profile.module.css';

import { useStore } from '../../../stores/globalStore';
import { usersApi } from '../../../api/user';

const VALIDATION_RULES = {
  userName: /^[a-zA-Z0-9_]{5,256}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^(?:\+7|8)[0-9]{7,14}$/,
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
    phoneNumber: user?.phoneNumber || '',
    email: user?.email || '',
    userName: user?.userName || '',
  });

  const [profileSnapshot, setProfileSnapshot] = useState({ ...profileForm });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [passwordError, setPasswordError] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const validateProfile = (data: typeof profileForm) => {
    const newErrors: Record<string, string> = {};

    if (!data.firstName.trim())
      newErrors.firstName = 'Имя не может быть пустым';
    if (!data.lastName.trim())
      newErrors.lastName = 'Фамилия не может быть пустой';

    if (!VALIDATION_RULES.userName.test(data.userName)) {
      newErrors.userName = 'Минимум 5 символов: латиница, цифры или _';
    }

    if (data.email && !VALIDATION_RULES.email.test(data.email)) {
      newErrors.email = 'Некорректный формат почты';
    }

    if (data.phoneNumber && !VALIDATION_RULES.phone.test(data.phoneNumber)) {
      newErrors.phoneNumber = 'Некорректный формат телефона';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    validateProfile(profileForm);
  }, [profileForm]);

  const profileChanged = useMemo(() => {
    return JSON.stringify(profileForm) !== JSON.stringify(profileSnapshot);
  }, [profileForm, profileSnapshot]);

  const isProfileValid = useMemo(() => {
    return (
      profileForm.firstName.trim() !== '' &&
      profileForm.lastName.trim() !== '' &&
      VALIDATION_RULES.userName.test(profileForm.userName) &&
      (!profileForm.email || VALIDATION_RULES.email.test(profileForm.email)) &&
      (!profileForm.phoneNumber ||
        VALIDATION_RULES.phone.test(profileForm.phoneNumber))
    );
  }, [profileForm]);

  const passwordReady =
    currentPassword.length > 8 &&
    newPassword.length > 8 &&
    newPassword === confirmPassword;

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
          phoneNumber: profile.phoneNumber ?? '',
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
    console.log(profileChanged);

    if (!user || !profileChanged || !validateProfile(profileForm)) return;
    console.log('I AM HERE~~~');
    try {
      setProfileSuccess(false);
      const updatedProfile = await usersApi.updateProfile({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        phoneNumber: profileForm.phoneNumber,
        userName: profileForm.userName,
      });
      setUser({
        ...user,
        ...updatedProfile,
      });
      setProfileSuccess(true);
      // const queryClient = useQueryClient();
      // queryClient.invalidateQueries();
    } catch (e: any) {
      setProfileError(`Ошибка: ${e.response.data?.detail}. Попробуйте снова`);
    }
  };

  const handleChangePassword = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!user || !passwordReady) return;
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
              <label className={styles['label']}>
                {/* {t('profile.label_name')} */}
                Имя
              </label>
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
                <span className={styles['error-text']}>{errors.firstName}</span>
              )}
            </div>

            <div className={styles['input-group']}>
              <label className={styles['label']}>
                {/* {t('profile.label_name')} */}
                Фамилия
              </label>
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
                <span className={styles['error-text']}>{errors.lastName}</span>
              )}
            </div>

            <div className={styles['input-group']}>
              <label className={styles['label']}>
                {/* {t('profile.label_name')} */}
                Имя пользователя
              </label>
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
                <span className={styles['error-text']}>{errors.userName}</span>
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
                <span className={styles['error-text']}>{errors.email}</span>
              )}
            </div>

            <div className={styles['input-group']}>
              <label className={styles['label']}>Телефон</label>
              <input
                type="tel"
                className={styles['text-input']}
                value={profileForm.phoneNumber}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    phoneNumber: e.target.value,
                  })
                }
              />
              {errors.phoneNumber && (
                <span className={styles['error-text']}>
                  {errors.phoneNumber}
                </span>
              )}
            </div>
          </div>
          {profileSuccess && (
            <p className={styles['success-msg']}>Данные сохранены</p>
          )}
          {profileError && (
            <p className={styles['error-text']}>{profileError}</p>
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

        <form className={styles['section']} onClick={handleChangePassword}>
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

              {newPassword &&
                confirmPassword &&
                newPassword !== confirmPassword && (
                  <p className={styles['error-msg']}>Пароли не совпадают</p>
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
