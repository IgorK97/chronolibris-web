/* eslint-disable @typescript-eslint/no-explicit-any */
// File: src/components/ThemeManager.tsx
import React, { useState } from 'react';
import {
  useThemes,
  useThemesByParentId,
  useCreateTheme,
  useUpdateTheme,
  useDeleteTheme,
} from '@/api/themes';
import type { CreateThemeRequest, UpdateThemeRequest } from '@/api/themes';
import type { ThemeDto } from '@/types/types';
import styles from './ThemeManager.module.css';
import { ExpandChildButton } from '@/components/buttons/ExpandChildButton';
import { Pencil, Trash2, X } from 'lucide-react';

export const ThemeManager: React.FC = () => {
  const { data: themes, isLoading, error, refetch } = useThemes();
  const createMutation = useCreateTheme();
  const updateMutation = useUpdateTheme();
  const deleteMutation = useDeleteTheme();

  const [formData, setFormData] = useState<CreateThemeRequest>({
    name: '',
    parentThemeId: null,
  });

  // Храним имя выбранного родителя для отображения в форме
  const [selectedParentName, setSelectedParentName] = useState<string | null>(
    null
  );

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateThemeRequest | null>(
    null
  );
  const [expandedThemes, setExpandedThemes] = useState<Set<number>>(new Set());

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert('Название темы обязательно');
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      setFormData({ name: '', parentThemeId: null });
      setSelectedParentName(null); // Сброс после создания
      refetch();
    } catch (err: any) {
      console.error('Ошибка создания темы:', err);
      alert(err.response?.data?.message || 'Ошибка создания темы');
    }
  };

  const handleUpdate = async (
    id: number,
    name: string,
    parentThemeId?: number | null
  ) => {
    if (!name.trim()) {
      alert('Название темы обязательно');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id,
        data: { id, name, parentThemeId } as UpdateThemeRequest,
      });
      setEditingId(null);
      setEditFormData(null);
      refetch();
    } catch (err: any) {
      console.error('Ошибка обновления темы:', err);
      alert(err.response?.data?.message || 'Ошибка обновления темы');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту тему?')) {
      try {
        await deleteMutation.mutateAsync(id);
        refetch();
      } catch (err: any) {
        console.error('Ошибка удаления темы:', err);
        alert(err.response?.data?.message || 'Ошибка удаления темы');
      }
    }
  };

  const startEditing = (theme: ThemeDto) => {
    setEditingId(theme.id);
    setEditFormData({
      id: theme.id,
      name: theme.name,
      parentThemeId: theme.parentThemeId,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData(null);
  };

  const toggleExpand = (themeId: number) => {
    setExpandedThemes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(themeId)) {
        newSet.delete(themeId);
      } else {
        newSet.add(themeId);
      }
      return newSet;
    });
  };

  // Метод для выбора родительской темы кликом в списке
  const handleSelectParent = (theme: ThemeDto) => {
    if (formData.parentThemeId === theme.id) {
      setFormData({ ...formData, parentThemeId: null });
      setSelectedParentName(null);
    } else {
      setFormData({ ...formData, parentThemeId: theme.id });
      setSelectedParentName(theme.name);
    }
  };

  if (isLoading) {
    return (
      <div className={styles['theme-manager']}>
        <div className={styles['loading']}>Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles['theme-manager']}>
        <div className={styles['error']}>
          Ошибка: {(error as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div className={styles['theme-manager']}>
      <h2>Управление темами</h2>

      {/* Форма создания */}
      <div className={styles['form-section']}>
        <div className={styles['form-grid']}>
          <p style={{ marginBottom: '10px' }}>Добавить новую тему</p>
          <div className={styles['form-group']}>
            <label>Название темы *</label>
            <input
              type="text"
              placeholder="Название темы (например: Фантастика)"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={styles['input-field']}
              maxLength={500}
            />
          </div>

          <div className={styles['form-group']}>
            <label>Родительская тема (выберите в списке ниже)</label>
            <div className={styles['parent-selection-display']}>
              <span className={styles['selected-parent-text']}>
                {selectedParentName || 'Без родительской темы'}
              </span>
              {formData.parentThemeId && (
                <button
                  type="button"
                  className={styles['btn-clear']}
                  onClick={() => {
                    setFormData({ ...formData, parentThemeId: null });
                    setSelectedParentName(null);
                  }}
                >
                  <X />
                </button>
              )}
            </div>
            <p style={{ marginBottom: '10px' }}>
              Кликните на тему в списке, чтобы сделать её родительской
            </p>
          </div>

          <button
            onClick={handleCreate}
            disabled={createMutation.isPending || !formData.name.trim()}
            className={styles['btn']}
          >
            {createMutation.isPending ? 'Создание...' : 'Создать тему'}
          </button>
        </div>
      </div>

      {/* Список тем с иерархией */}
      <div className={styles['list-section']}>
        <h3>Список тем</h3>

        <div className={styles['themes-tree']}>
          {themes?.map((theme) => (
            <ThemeTreeNode
              key={theme.id}
              theme={theme}
              editingId={editingId}
              editFormData={editFormData}
              setEditFormData={setEditFormData}
              allThemes={themes || []}
              onStartEditing={startEditing}
              onCancelEditing={cancelEditing}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onToggleExpand={toggleExpand}
              isExpanded={expandedThemes.has(theme.id)}
              expandedThemes={expandedThemes}
              updateMutation={updateMutation}
              deleteMutation={deleteMutation}
              // Передаем новые пропсы для выбора
              onSelectParent={handleSelectParent}
              selectedParentId={formData.parentThemeId}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Компонент узла дерева тем
interface ThemeTreeNodeProps {
  theme: ThemeDto;
  editingId: number | null;
  editFormData: UpdateThemeRequest | null;
  setEditFormData: (data: UpdateThemeRequest | null) => void;
  allThemes: ThemeDto[];
  onStartEditing: (theme: ThemeDto) => void;
  onCancelEditing: () => void;
  onUpdate: (id: number, name: string, parentThemeId?: number | null) => void;
  onDelete: (id: number) => void;
  onToggleExpand: (themeId: number) => void;
  isExpanded: boolean;
  expandedThemes: Set<number>;
  updateMutation: any;
  deleteMutation: any;
  onSelectParent: (theme: ThemeDto) => void;
  selectedParentId: number | null;
}

const ThemeTreeNode: React.FC<ThemeTreeNodeProps> = ({
  theme,
  editingId,
  editFormData,
  setEditFormData,
  allThemes,
  onStartEditing,
  onCancelEditing,
  onUpdate,
  onDelete,
  onToggleExpand,
  isExpanded,
  expandedThemes,
  updateMutation,
  deleteMutation,
  onSelectParent,
  selectedParentId,
}) => {
  const { data: subThemes } = useThemesByParentId(isExpanded ? theme.id : null);
  const hasSubThemes = (theme.subThemesCount || 0) > 0;
  const isSelectedAsParent = selectedParentId === theme.id;

  if (editingId === theme.id) {
    return (
      <div className={styles['theme-node editing']}>
        <div className={styles['theme-content']}>
          <input
            type="text"
            value={editFormData?.name || ''}
            onChange={(e) =>
              setEditFormData({
                ...editFormData!,
                name: e.target.value,
              })
            }
            className={styles['input-field']}
            maxLength={500}
          />
          <select
            value={editFormData?.parentThemeId || ''}
            onChange={(e) =>
              setEditFormData({
                ...editFormData!,
                parentThemeId: e.target.value ? Number(e.target.value) : null,
              })
            }
            className={styles['input-field']}
          >
            <option value="">Без родительской темы</option>
            {allThemes
              .filter((t) => t.id !== theme.id)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
          <button
            onClick={() =>
              onUpdate(
                theme.id,
                editFormData?.name || '',
                editFormData?.parentThemeId
              )
            }
            className={styles['btn btn-success btn-sm']}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? '...' : '✓'}
          </button>
          <button
            onClick={onCancelEditing}
            className={styles['btn btn-secondary btn-sm']}
            disabled={updateMutation.isPending}
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(theme.id);
  };

  return (
    <div className={styles['theme-node']}>
      <div
        className={`${styles['theme-content']} ${isSelectedAsParent ? styles['selected-parent'] : ''}`}
      >
        <ExpandChildButton
          hasChildren={hasSubThemes}
          handleExpandClick={handleExpandClick}
          isExpanded={isExpanded}
        />

        {/* Кликабельное название темы */}
        <span
          className={styles['theme-name-clickable']}
          onClick={() => onSelectParent(theme)}
          title="Нажмите, чтобы выбрать как родителя"
        >
          {theme.name}
        </span>

        {theme.subThemesCount ? (
          <span className={styles['sub-themes-count']}>
            ({theme.subThemesCount} дочерних)
          </span>
        ) : null}

        <div className={styles['theme-actions']}>
          <button
            onClick={() => onStartEditing(theme)}
            className={styles['btn btn-warning btn-sm']}
            disabled={deleteMutation.isPending || updateMutation.isPending}
          >
            <Pencil style={{ cursor: 'pointer' }} />
          </button>
          <button
            onClick={() => onDelete(theme.id)}
            className={styles['btn btn-danger btn-sm']}
            disabled={
              deleteMutation.isPending ||
              updateMutation.isPending ||
              hasSubThemes
            }
            title={hasSubThemes ? 'Сначала удалите дочерние темы' : 'Удалить'}
          >
            <Trash2 style={{ cursor: 'pointer' }} />
          </button>
        </div>
      </div>

      {isExpanded && subThemes && subThemes.length > 0 && (
        <div className={styles['sub-themes']}>
          {subThemes.map((subTheme) => (
            <ThemeTreeNode
              key={subTheme.id}
              theme={subTheme}
              editingId={editingId}
              editFormData={editFormData}
              setEditFormData={setEditFormData}
              allThemes={allThemes}
              onStartEditing={onStartEditing}
              onCancelEditing={onCancelEditing}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onToggleExpand={onToggleExpand}
              isExpanded={expandedThemes.has(subTheme.id)}
              expandedThemes={expandedThemes}
              updateMutation={updateMutation}
              deleteMutation={deleteMutation}
              onSelectParent={onSelectParent}
              selectedParentId={selectedParentId}
            />
          ))}
        </div>
      )}
    </div>
  );
};
