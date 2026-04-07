// import styles from './ParticipantsInfo.module.css';
// import type {
//   BookDetails,
//   BookPersonGroupDetails,
//   RoleDetails,
// } from '@/types/types';

// interface ParticipantsInfoProps {
//   bookInfo: BookDetails;
//   participants: BookPersonGroupDetails[];
//   roles: RoleDetails[];
// }

// /**
//  * Resolves a role name by its numeric ID.
//  * Falls back to "Участник" if the role is not found in the dictionary.
//  */
// function getRoleName(roleId: number, roles: RoleDetails[]): string {
//   return roles.find((r) => r.id === roleId)?.name ?? 'Участник';
// }

// export const ParticipantsInfo = ({
//   participants,
//   bookInfo,
//   roles,
// }: ParticipantsInfoProps) => {
//   // Filter out groups that have no persons to avoid rendering empty sections
//   const nonEmptyGroups = participants.filter((g) => g.persons.length > 0);

//   if (nonEmptyGroups.length === 0) {
//     return <p className={styles['empty']}>Информация о людях недоступна.</p>;
//   }

//   return (
//     <div>
//       <div className={styles['container']}>
//         {nonEmptyGroups.map((group) => {
//           const roleName = getRoleName(group.role, roles);
//           return (
//             <section key={group.role} className={styles['group']}>
//               <h3 className={styles['role-label']}>{roleName}</h3>
//               <ul className={styles['persons-list']}>
//                 {group.persons.map((person) => (
//                   <li key={person.id} className={styles['person-item']}>
//                     {/*
//                     <span className={styles['avatar']} aria-hidden="true">
//                       {getInitials(person.fullName)}
//                     </span> */}
//                     <span className={styles['person-name']}>
//                       {person.fullName}
//                     </span>
//                   </li>
//                 ))}
//               </ul>
//             </section>
//           );
//         })}
//       </div>
//       <div className={styles['source']}>
//         <p>
//           Источник данных: <em>{bookInfo.source ?? 'неизвестно'}</em>
//         </p>
//       </div>
//       <div className={styles['isbn']}>
//         <p>
//           ISBN: <em>{bookInfo.isbn ?? 'нет данных'}</em>
//         </p>
//       </div>
//       <div className={styles['bbk-udk']}>
//         <p>
//           ББК: <em>{bookInfo.bbk ?? 'нет данных'}</em>
//         </p>
//         <p>
//           УДК: <em>{bookInfo.udk ?? 'нет данных'}</em>
//         </p>
//       </div>
//       <div className={styles['language']}>
//         <p>
//           Язык: <em>{bookInfo.language?.name ?? 'неизвестно'}</em>
//         </p>
//       </div>
//       <div className={styles['country']}>
//         <p>
//           Страна: <em>{bookInfo.country?.name ?? 'неизвестно'}</em>
//         </p>
//       </div>
//       <div className={styles['publication-year']}>
//         <p>
//           Год публикации: <em>{bookInfo.year ?? 'неизвестно'}</em>
//         </p>
//       </div>
//       <div className={styles['publisher']}>
//         <p>
//           Издательство: <em>{bookInfo.publisher?.name ?? 'неизвестно'}</em>
//         </p>
//       </div>
//     </div>
//   );
// };

// ParticipantsInfo.tsx
import styles from './ParticipantsInfo.module.css';
import type {
  BookDetails,
  BookPersonGroupDetails,
  RoleDetails,
} from '@/types/types';

interface ParticipantsInfoProps {
  bookInfo: BookDetails;
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
  bookInfo,
  roles,
}: ParticipantsInfoProps) => {
  // Filter out groups that have no persons to avoid rendering empty sections
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
        {/* Источник данных */}
        <div className={styles['info-card']}>
          <div className={styles['info-label']}>Источник данных</div>
          <div className={styles['info-value']}>
            {bookInfo.source ?? 'неизвестно'}
          </div>
        </div>

        {/* ISBN */}
        <div className={styles['info-card']}>
          <div className={styles['info-label']}>ISBN</div>
          <div className={styles['info-value']}>
            {bookInfo.isbn ?? 'нет данных'}
          </div>
        </div>

        {/* ББК и УДК */}
        <div className={styles['info-card']}>
          <div className={styles['info-row']}>
            <div className={styles['info-label']}>ББК</div>
            <div className={styles['info-value']}>
              {bookInfo.bbk ?? 'нет данных'}
            </div>
          </div>
          <div className={styles['info-row']}>
            <div className={styles['info-label']}>УДК</div>
            <div className={styles['info-value']}>
              {bookInfo.udk ?? 'нет данных'}
            </div>
          </div>
        </div>

        {/* Язык */}
        <div className={styles['info-card']}>
          <div className={styles['info-label']}>Язык</div>
          <div className={styles['info-value']}>
            {bookInfo.language?.name ?? 'неизвестно'}
          </div>
        </div>

        {/* Страна */}
        <div className={styles['info-card']}>
          <div className={styles['info-label']}>Страна</div>
          <div className={styles['info-value']}>
            {bookInfo.country?.name ?? 'неизвестно'}
          </div>
        </div>

        {/* Год публикации */}
        <div className={styles['info-card']}>
          <div className={styles['info-label']}>Год публикации</div>
          <div className={styles['info-value']}>
            {bookInfo.year ?? 'неизвестно'}
          </div>
        </div>

        {/* Издательство */}
        <div className={styles['info-card']}>
          <div className={styles['info-label']}>Издательство</div>
          <div className={styles['info-value']}>
            {bookInfo.publisher?.name ?? 'неизвестно'}
          </div>
        </div>
      </div>
    </div>
  );
};
