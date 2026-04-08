import {
  useFormats,
  useCreateFormat,
  useUpdateFormat,
  useDeleteFormat,
} from '@/api/references';
import { SimpleEntityManager } from './SimpleEntityManager';

export const FormatManager = () => {
  const { data, isLoading, error } = useFormats();
  const create = useCreateFormat();
  const update = useUpdateFormat();
  const del = useDeleteFormat();

  return (
    <SimpleEntityManager
      title="Управление форматами книг"
      createLabel="Создать формат"
      createPlaceholder="Название формата"
      maxLength={50}
      items={data}
      isLoading={isLoading}
      error={error}
      onCreate={async (name) => {
        const res = () => create.mutateAsync({ name });
        res();
      }}
      onUpdate={(id, name) => update.mutateAsync({ id, data: { id, name } })}
      onDelete={(id) => del.mutateAsync(id)}
      isCreating={create.isPending}
      isUpdating={update.isPending}
      isDeleting={del.isPending}
    />
  );
};
