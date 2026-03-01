import {
  // React,
  useEffect,
  useState,
} from 'react';
import { ArrowLeft, ChevronRight, User } from 'lucide-react';
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
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isSecurityModalVisible, setIsSecurityModalVisible] = useState(false);
  const { user, setUser, clearStore } = useStore();

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    email: user?.email || '',
  });

  // const [userName, setUserName] = useState(user?.firstName || "");
  // const [userEmail, setUserEmail] = useState(user?.email || "");

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { t } = useTranslation();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await usersApi.getProfile();
        setUser(profile);
        setFormData({
          firstName: profile.firstName,
          email: profile.email || '',
        }); //так как юзстате принимает инитиал стейт, который после первого рендера игнорируется
      } catch (e) {
        console.error('Failed to load profile', e);
      }
    };
    loadProfile();
  }, [setUser]);

  // useEffect(() => {
  //   if (user) {
  //     setFormData({ firstName: user.firstName, email: user.email || "" });
  //   }
  // }, [user]);

  const logout = () => {
    //usersApi.logout(); // Если есть API для логаута
    clearStore(); // Очистка состояния хранилища - юзер, книги и т.д.
    onNavigate();
    // localStorage.removeItem("token");
    // localStorage.removeItem("refresh");
    // localStorage.removeItem("profile");
    // setUser(null);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      const updatedProfile = await usersApi.updateProfile({
        firstName: formData.firstName,
        lastName: user?.lastName || '',
        email: formData.email,
        userId: user.userId,
      });
      setUser({
        ...user,
        firstName: updatedProfile.firstName,
        email: updatedProfile.email,
      });
      setIsProfileModalVisible(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSecurity = async () => {
    if (!user || !currentPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) return;

    try {
      await usersApi.changePassword({
        currentPassword: currentPassword,
        newPassword: newPassword,
        userId: user.userId,
      });
      setIsSecurityModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={styles['container']}>
      <div className={styles['scroll-container']}>
        {/* Profile Summary Section */}
        <section className={styles['profile-section']}>
          <div className={styles['avatar']}>
            <User size={24} color="#9ca3af" />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 500 }}>
              {user ? user.firstName : 'profile.guest'}
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
              {user ? user.email : ''}
            </p>
          </div>
        </section>

        {/* Settings Section */}
        <div className={styles['section']}>
          <h3 style={{ padding: '0 16px', fontSize: '14px', color: '#6b7280' }}>
            {t('profile.label_settings')}
          </h3>
          <button
            className={styles['row']}
            onClick={() => setIsProfileModalVisible(true)}
          >
            <span>{t('profile.label_profile_settings')}</span>
            <ChevronRight size={20} color="#d1d5db" />
          </button>
          <button
            className={styles['row']}
            onClick={() => setIsSecurityModalVisible(true)}
          >
            <span>{t('profile.label_security')}</span>
            <ChevronRight size={20} color="#d1d5db" />
          </button>
        </div>

        {/* Help/Auth Section */}
        <div className={styles['section']}>
          <h3 style={{ padding: '0 16px', fontSize: '14px', color: '#6b7280' }}>
            {t('profile.label_help')}
          </h3>
          <button
            className={styles['row']}
            onClick={() => (user ? logout() : onNavigate())}
          >
            <span style={{ color: '#D32F2F', fontWeight: 500 }}>
              {user ? t('profile.exit') : t('profile.enter')}
            </span>
            <ChevronRight size={20} color="#d1d5db" />
          </button>
        </div>
      </div>

      {/* Profile Settings Modal Overlay */}
      {isProfileModalVisible && (
        <div className={styles['modal-overlay']}>
          <div className={styles['modal-header']}>
            <button
              className={styles['close-button']}
              onClick={() => setIsProfileModalVisible(false)}
            >
              <ArrowLeft size={24} color="#000" />
            </button>
            <h2 style={{ fontSize: '18px', fontWeight: 600 }}>
              {t('profile.title_prof_sett')}
            </h2>
            <div style={{ width: 40 }} /> {/* Spacer to center title */}
          </div>

          <div className={styles['form']}>
            <div className={styles['input-group']}>
              <label className={styles['label']}>
                {t('profile.label_name')}
              </label>
              <input
                className={styles['text-input']}
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
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
                className={styles.textInput}
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder={t('profile.ph_email')}
              />
            </div>
          </div>

          <div className={styles['bottom-actions']}>
            <button
              className={styles['save-button-bottom']}
              onClick={handleSaveProfile}
            >
              {t('profile.save')}
            </button>
          </div>
        </div>
      )}

      {/* Security Settings Modal Overlay */}
      {isSecurityModalVisible && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalHeader}>
            <button
              className={styles.closeButton}
              onClick={() => setIsSecurityModalVisible(false)}
            >
              <ArrowLeft size={24} color="#000" />
            </button>
            <h2 style={{ fontSize: '18px', fontWeight: 600 }}>
              {t('profile.title_sec_sett')}
            </h2>
            <div style={{ width: 40 }} />
          </div>

          <div className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>{t('profile.label_pass')}</label>
              <input
                type="password"
                className={styles.textInput}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('profile.ph_pass')}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                {t('profile.label_new_pass')}
              </label>
              <input
                type="password"
                className={styles.textInput}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('profile.ph_new_pass')}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                {t('profile.label_conf_pass')}
              </label>
              <input
                type="password"
                className={styles.textInput}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('profile.ph_conf_pass')}
              />
            </div>
          </div>

          <div className={styles.bottomActions}>
            <button
              className={styles.saveButtonBottom}
              onClick={handleSaveSecurity}
            >
              {t('profile.save')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
