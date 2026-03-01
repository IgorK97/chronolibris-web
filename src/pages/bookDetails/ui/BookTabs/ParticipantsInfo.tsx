import styles from './ParticipantsInfo.module.css';
import type { BookPersonGroupDetails, RoleDetails } from '@/types/types';

interface ParticipantsInfoProps {
  participants: BookPersonGroupDetails[];
  roles: RoleDetails[];
}

/**
 * Resolves a role name by its numeric ID.
 * Falls back to "Участник" if the role is not found in the dictionary.
 */
function getRoleName(roleId: number, roles: RoleDetails[]): string {
  return roles.find((r) => r.id === roleId)?.name ?? 'Участник';
}

export const ParticipantsInfo = ({
  participants,
  roles,
}: ParticipantsInfoProps) => {
  // Filter out groups that have no persons to avoid rendering empty sections
  const nonEmptyGroups = participants.filter((g) => g.persons.length > 0);

  if (nonEmptyGroups.length === 0) {
    return (
      <p className={styles['empty']}>Информация об участниках недоступна.</p>
    );
  }

  return (
    <div className={styles['container']}>
      {nonEmptyGroups.map((group) => {
        const roleName = getRoleName(group.role, roles);
        return (
          <section key={group.role} className={styles['group']}>
            {/* Role label — e.g. "Автор", "Переводчик", "Иллюстратор" */}
            <h3 className={styles['role-label']}>{roleName}</h3>

            <ul className={styles['persons-list']}>
              {group.persons.map((person) => (
                <li key={person.id} className={styles['person-item']}>
                  {/* Avatar initials — generated from the person's full name */}
                  <span className={styles['avatar']} aria-hidden="true">
                    {getInitials(person.fullName)}
                  </span>
                  <span className={styles['person-name']}>
                    {person.fullName}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
};

/**
 * Extracts up to two initials from a full name.
 * "Лев Николаевич Толстой" → "ЛТ"
 * "Фёдор Достоевский"      → "ФД"
 * "Гомер"                  → "Г"
 */
function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  // Take first and last word for the initials (skips patronymic)
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
