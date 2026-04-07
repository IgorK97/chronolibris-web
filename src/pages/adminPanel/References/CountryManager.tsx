import { SimpleEntityManager } from './SimpleEntityManager';
import {
  useCountries,
  useCreateCountry,
  useUpdateCountry,
  useDeleteCountry,
} from '@/api/references';

export const CountryManager = () => {
  const { data, isLoading, error } = useCountries();
  const create = useCreateCountry();
  const update = useUpdateCountry();
  const del = useDeleteCountry();

  return (
    <SimpleEntityManager
      title="Управление странами"
      createLabel="Создать страну"
      createPlaceholder="Название страны"
      maxLength={255}
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
    />
  );
};
