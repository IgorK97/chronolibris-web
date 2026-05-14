import {
  useLanguages,
  useCreateLanguage,
  useUpdateLanguage,
  useDeleteLanguage,
} from '@/api/references';
import { SimpleEntityManager } from './SimpleEntityManager';

export const LanguageManager = () => {
  const { data, isLoading, error } = useLanguages();
  const create = useCreateLanguage();
  const update = useUpdateLanguage();
  const del = useDeleteLanguage();

  return (
    <SimpleEntityManager
      title="Управление языками"
      createLabel="Создать язык"
      createPlaceholder="Название языка"
      items={data}
      isLoading={isLoading}
      error={error}
      onCreate={async (name) => {
        create.mutateAsync({ name });
      }}
      onUpdate={(id, name) => update.mutateAsync({ id, data: { id, name } })}
      onDelete={(id) => del.mutateAsync(id)}
      isCreating={create.isPending}
      isUpdating={update.isPending}
      isDeleting={del.isPending}
      maxLength={50}
    />
  );
};
