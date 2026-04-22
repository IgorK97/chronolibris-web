import styles from './ParticipantsInfo.module.css';
import type { BookDetails, BookPersonGroupDetails, RoleDetails } from '@/types';

interface ParticipantsInfoProps {
  bookInfo: BookDetails;
  participants: BookPersonGroupDetails[];
  roles: RoleDetails[];
}

function getRoleName(roleId: number, roles: RoleDetails[]): string {
  return roles.find((r) => r.id === roleId)?.name ?? 'Участник';
}

export const ParticipantsInfo = ({
  participants,
  bookInfo,
  roles,
}: ParticipantsInfoProps) => {
  const nonEmptyGroups = participants.filter((g) => g.persons.length > 0);

  return (
    <div>
      {nonEmptyGroups.length === 0 ? (
        <p className={styles['empty']}>Информация о людях недоступна.</p>
      ) : (
        <div className={styles['container']}>
          {nonEmptyGroups.map((group) => {
            const roleName = getRoleName(group.role, roles);
            return (
              <section key={group.role} className={styles['group']}>
                <h3 className={styles['role-label']}>{roleName}</h3>
                <ul className={styles['persons-list']}>
                  {group.persons.map((person) => (
                    <li key={person.id} className={styles['person-item']}>
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
      )}

      <div className={styles['book-info']}>
        <div className={styles['info-card']}>
          <div className={styles['info-label']}>Источник данных</div>
          <div className={styles['info-value']}>{bookInfo.source ?? '—'}</div>
        </div>

        <div className={styles['info-card']}>
          <div className={styles['info-label']}>ISBN</div>
          <div className={styles['info-value']}>{bookInfo.isbn ?? '—'}</div>
        </div>

        <div className={styles['info-card']}>
          <div className={styles['info-row']}>
            <div className={styles['info-label']}>ББК</div>
            <div className={styles['info-value']}>{bookInfo.bbk ?? '—'}</div>
          </div>
          <div className={styles['info-row']}>
            <div className={styles['info-label']}>УДК</div>
            <div className={styles['info-value']}>{bookInfo.udk ?? '—'}</div>
          </div>
        </div>

        <div className={styles['info-card']}>
          <div className={styles['info-label']}>Язык</div>
          <div className={styles['info-value']}>
            {bookInfo.language?.name ?? '—'}
          </div>
        </div>

        <div className={styles['info-card']}>
          <div className={styles['info-label']}>Страна</div>
          <div className={styles['info-value']}>
            {bookInfo.country?.name ?? '—'}
          </div>
        </div>

        <div className={styles['info-card']}>
          <div className={styles['info-label']}>Год публикации</div>
          <div className={styles['info-value']}>{bookInfo.year ?? '—'}</div>
        </div>

        <div className={styles['info-card']}>
          <div className={styles['info-label']}>Издательство</div>
          <div className={styles['info-value']}>
            {bookInfo.publisher?.name ?? '—'}
          </div>
        </div>
      </div>
    </div>
  );
};
