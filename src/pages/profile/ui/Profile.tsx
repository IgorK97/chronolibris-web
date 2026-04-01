import {
  // React,
  useEffect,
  useState,
} from 'react';
import { User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './Profile.module.css';

// Shared imports - adjust paths to your web project structure
import { useStore } from '../../../stores/globalStore';
import {
  usersApi,
  // changePassword,
  // getProfile,
  // updateProfile,
} from '../../../api/user';

interface ProfileProps {
  onNavigate: () => void;
}

export const Profile = ({ onNavigate }: ProfileProps) => {
  const { user, setUser, clearStore } = useStore();

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phoneNumber: user?.phoneNumber || '',
    email: user?.email || '',
    userName: user?.userName || '',
  });

  const [profileSnapshot, setProfileSnapshot] = useState({ ...profileForm });
  const profileChanged =
    profileForm.firstName !== profileSnapshot.firstName ||
    profileForm.email !== profileSnapshot.email ||
    profileForm.lastName !== profileSnapshot.lastName ||
    profileForm.userName !== profileSnapshot.userName ||
    profileForm.phoneNumber !== profileSnapshot.phoneNumber;
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { t } = useTranslation();
  const passwordReady =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    newPassword === confirmPassword;

  const [passwordError, setPasswordError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
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
      } catch (e) {
        console.error('Failed to load profile', e);
      }
    };
    loadProfile();
  }, [setUser]);

  const logout = () => {
    clearStore();
    onNavigate();
  };

  const handleSaveProfile = async () => {
    if (!user || !profileChanged) return;
    try {
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
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangePassword = async () => {
    if (!user || !passwordReady) return;
    setPasswordError('');

    try {
      await usersApi.changePassword({
        currentPassword: currentPassword,
        newPassword: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(true);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      setPasswordError('Не удалось сменить пароль. Попробуйте снова');
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

        <div className={styles['section']}>
          <h3 className={styles['section-title']}>
            {t('profile.label_settings')}
          </h3>
          <div className={styles['form']}>
            <div className={styles['input-group']}>
              <label className={styles['label']}>
                {t('profile.label_name')}
              </label>
              <input
                className={styles['text-input']}
                value={profileForm.firstName}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, firstName: e.target.value })
                }
                placeholder={t('profile.ph_name')}
              />
            </div>

            <div className={styles['input-group']}>
              <label className={styles['label']}>
                {t('profile.label_name')}
              </label>
              <input
                className={styles['text-input']}
                value={profileForm.lastName}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, lastName: e.target.value })
                }
                placeholder={t('profile.ph_name')}
              />
            </div>

            <div className={styles['input-group']}>
              <label className={styles['label']}>
                {t('profile.label_name')}
              </label>
              <input
                className={styles['text-input']}
                value={profileForm.userName}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, userName: e.target.value })
                }
                placeholder={t('profile.ph_name')}
              />
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
            </div>
          </div>
        </div>
        {profileSuccess && (
          <p className={styles['success-msg']}>Данные сохранены</p>
        )}
        <button
          className={styles['save-button-bottom']}
          onClick={handleSaveProfile}
          disabled={!profileChanged}
        >
          {t('profile.save')}
        </button>
        <div className={styles['section']}>
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

              {newPassword.length > 0 &&
                confirmPassword.length > 0 &&
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
            className={styles['save-button-bottom']}
            onClick={handleChangePassword}
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
        </div>
      </div>
    </div>
  );
};
