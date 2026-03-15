/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// File: src/components/BookFileManagement.tsx
import React, { useState, useRef } from 'react';
import {
  useBookFiles,
  useUploadBookFile,
  useUpdateBookFile,
  useDeleteBookFile,
  useDownloadBookFile,
} from '@/api/bookFiles';
import { useFormats } from '@/api/references';
import type { BookFileDto, FormatDto } from '@/types/types';
import { BookFileStatuses } from '@/types/types';
import styles from './BookFileManagement.module.css';

interface BookFileManagementProps {
  bookId: number;
}

export const BookFileManagement: React.FC<BookFileManagementProps> = ({
  bookId,
}) => {
  const { data: bookFiles, isLoading, error, refetch } = useBookFiles(bookId);
  const { data: formats } = useFormats();
  const uploadMutation = useUploadBookFile();
  const updateMutation = useUpdateBookFile();
  const deleteMutation = useDeleteBookFile();
  const downloadMutation = useDownloadBookFile();

  const [selectedFormat, setSelectedFormat] = useState<number>(0);
  const [isReadable, setIsReadable] = useState<boolean>(false);
  const [editingFile, setEditingFile] = useState<BookFileDto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      alert('Выберите файл для загрузки');
      return;
    }

    if (selectedFormat <= 0) {
      alert('Выберите формат файла');
      return;
    }

    const file = fileInputRef.current.files[0];

    // Проверка размера (100 MB)
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert('Размер файла не должен превышать 100 MB');
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        bookId,
        formatId: selectedFormat,
        isReadable,
        file,
      });

      // Сброс формы
      setSelectedFormat(0);
      setIsReadable(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка загрузки файла');
    }
  };

  const handleUpdate = async () => {
    if (!editFileInputRef.current?.files?.[0] || !editingFile) {
      alert('Выберите файл для обновления');
      return;
    }

    const file = editFileInputRef.current.files[0];

    // Проверка размера (100 MB)
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert('Размер файла не должен превышать 100 MB');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        bookId,
        formatId: editingFile.formatId,
        isReadable: editingFile.isReadable,
        file,
      });

      setEditingFile(null);
      if (editFileInputRef.current) {
        editFileInputRef.current.value = '';
      }

      refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка обновления файла');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот файл?')) {
      try {
        await deleteMutation.mutateAsync(id);
        refetch();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Ошибка удаления файла');
      }
    }
  };

  const handleDownload = async (file: BookFileDto) => {
    try {
      const blob = await downloadMutation.mutateAsync(file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `book_file_${file.id}.${file.formatName?.toLowerCase() || 'file'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert('Ошибка скачивания файла');
    }
  };

  const getStatusBadge = (statusId: number) => {
    const statusMap: Record<number, { label: string; color: string }> = {
      [BookFileStatuses.PENDING]: { label: 'Ожидание', color: '#ffc107' },
      [BookFileStatuses.UPLOADED]: { label: 'Загружен', color: '#28a745' },
      [BookFileStatuses.PROCESSING]: { label: 'Обработка', color: '#17a2b8' },
      [BookFileStatuses.COMPLETED]: { label: 'Готов', color: '#28a745' },
      [BookFileStatuses.FAILED]: { label: 'Ошибка', color: '#dc3545' },
    };

    const status = statusMap[statusId] || {
      label: 'Неизвестно',
      color: '#6c757d',
    };

    return (
      <span
        className={styles['status-badge']}
        style={{ backgroundColor: status.color }}
      >
        {status.label}
      </span>
    );
  };

  if (isLoading) return <div className={styles['loading']}>Загрузка...</div>;
  if (error)
    return (
      <div className={styles['error']}>Ошибка: {(error as Error).message}</div>
    );

  return (
    <div className={styles['book-file-management']}>
      <h3>Файлы книги</h3>

      {/* Форма загрузки */}
      <div className={styles['upload-section']}>
        <h4>Загрузить новый файл</h4>
        <div className={styles['form-grid']}>
          <div className={styles['form-group']}>
            <label>Формат *</label>
            <select
              value={selectedFormat}
              onChange={(e) => {
                const formatId = Number(e.target.value);
                setSelectedFormat(formatId);
                // FB2 (предположим id=1) может быть is_readable
                setIsReadable(formatId === 1);
              }}
              className={styles['input-field']}
            >
              <option value={0}>Выберите формат</option>
              {formats?.map((format) => (
                <option key={format.id} value={format.id}>
                  {format.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles['form-group']}>
            <label>Главный файл (для чтения)</label>
            <input
              type="checkbox"
              checked={isReadable}
              onChange={(e) => setIsReadable(e.target.checked)}
              disabled={selectedFormat !== 1} // Только FB2
              className={styles['checkbox-field']}
            />
            <span className={styles['hint']}>(только для FB2)</span>
          </div>

          <div className={styles['form-group']}>
            <label>Файл *</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".fb2,.epub,.pdf,.txt"
              className={styles['file-input']}
            />
            <span className={styles['hint']}>Макс. 100 MB</span>
          </div>

          <div className={styles['form-actions']}>
            <button
              onClick={handleUpload}
              disabled={uploadMutation.isPending || selectedFormat <= 0}
              className={`${styles['btn']} ${styles['btn-primary']}`}
            >
              {uploadMutation.isPending ? 'Загрузка...' : 'Загрузить'}
            </button>
          </div>
        </div>
      </div>

      {/* Список файлов */}
      <div className={styles['files-list']}>
        <h4>Существующие файлы ({bookFiles?.length || 0})</h4>
        <table className={styles['files-table']}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Формат</th>
              <th>Размер</th>
              <th>Статус</th>
              <th>Главный</th>
              <th>Версия</th>
              <th>Загружен</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {bookFiles?.map((file) => (
              <tr key={file.id}>
                {editingFile?.id === file.id ? (
                  <>
                    <td>{file.id}</td>
                    <td>{file.formatName}</td>
                    <td>{file.fileSizeDisplay}</td>
                    <td>{getStatusBadge(file.bookFileStatusId)}</td>
                    <td>{file.isReadable ? '✓' : '—'}</td>
                    <td>{file.version}</td>
                    <td>
                      {new Date(file.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td>
                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept=".fb2,.epub,.pdf,.txt"
                        className={styles['file-input']}
                      />
                      <button
                        onClick={handleUpdate}
                        disabled={updateMutation.isPending}
                        className={`${styles['btn']} ${styles['btn-success']} ${styles['btn-sm']}`}
                      >
                        {updateMutation.isPending ? '...' : 'Сохранить'}
                      </button>
                      <button
                        onClick={() => setEditingFile(null)}
                        className={`${styles['btn']} ${styles['btn-secondary']} ${styles['btn-sm']}`}
                      >
                        Отмена
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{file.id}</td>
                    <td>{file.formatName}</td>
                    <td>{file.fileSizeDisplay}</td>
                    <td>{getStatusBadge(file.bookFileStatusId)}</td>
                    <td>{file.isReadable ? '✓' : '—'}</td>
                    <td>{file.version}</td>
                    <td>
                      {new Date(file.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td>
                      <button
                        onClick={() => handleDownload(file)}
                        className={`${styles['btn']} ${styles['btn-info']} ${styles['btn-sm']}`}
                        disabled={
                          file.bookFileStatusId !== BookFileStatuses.COMPLETED
                        }
                      >
                        ⬇️
                      </button>
                      <button
                        onClick={() => setEditingFile(file)}
                        className={`${styles['btn']} ${styles['btn-warning']} ${styles['btn-sm']}`}
                        disabled={
                          deleteMutation.isPending || updateMutation.isPending
                        }
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(file.id)}
                        className={`${styles['btn']} ${styles['btn-danger']} ${styles['btn-sm']}`}
                        disabled={
                          deleteMutation.isPending || updateMutation.isPending
                        }
                      >
                        🗑️
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
