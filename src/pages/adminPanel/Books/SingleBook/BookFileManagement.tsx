/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from 'react';
import {
  useBookFiles,
  useUploadBookFile,
  useUpdateBookFile,
  useDeleteBookFile,
  // useDownloadBookFile,
  bookFilesApi,
} from '@/api/bookFiles';
import { useFormats } from '@/api/references';
import type { BookFileDto } from '@/types';
import { BookFileStatuses } from '@/types';
import styles from './BookFileManagement.module.css';
import { Download, Trash2 } from 'lucide-react';
import { t } from 'i18next';
import { AlertDialog } from '@/components/dialogs/AlertDialog';

interface BookFileManagementProps {
  bookId: number;
  bookTitle: string;
}

const FORMAT_EXTENSIONS: Record<number, string> = {
  1: 'fb2',
};

export const BookFileManagement: React.FC<BookFileManagementProps> = ({
  bookId,
  bookTitle,
}) => {
  const { data: bookFiles, isLoading, error, refetch } = useBookFiles(bookId);
  const { data: formats } = useFormats();
  const uploadMutation = useUploadBookFile();
  const updateMutation = useUpdateBookFile();
  const deleteMutation = useDeleteBookFile();
  // const downloadMutation = useDownloadBookFile();
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [deletingBookfile, setDeletingBookfile] = useState<number>(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

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
    const fileName = file.name.toLowerCase();
    const expectedExtension = FORMAT_EXTENSIONS[selectedFormat];

    if (expectedExtension && !fileName.endsWith(`.${expectedExtension}`)) {
      alert(
        `Выбранный файл не соответствует формату ${expectedExtension.toUpperCase()}`
      );
      return;
    }
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

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(deletingBookfile);
    refetch();
    setDeleteModalOpen(false);
  };

  const handleDownload = async (bookFileId: number, formatId: number) => {
    if (!bookFileId) return;
    setIsDownloading(true);
    setDownloadError(null);

    try {
      const { blob } = await bookFilesApi.download(bookFileId);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = FORMAT_EXTENSIONS[formatId - 1];
      a.download = `${bookTitle}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError(t('book.download_error'));
    } finally {
      setIsDownloading(false);
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
      <h4>Загрузить новый файл</h4>
      <div className={styles['form-grid']}>
        <div className={styles['form-group']}>
          <label>Формат *</label>
          <select
            value={selectedFormat}
            onChange={(e) => {
              const formatId = Number(e.target.value);
              setSelectedFormat(formatId);
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
          <label>Основной файл</label>
          <input
            type="checkbox"
            checked={isReadable}
            onChange={(e) => setIsReadable(e.target.checked)}
            disabled={selectedFormat !== 1}
            className={styles['checkbox-field']}
          />
        </div>

        <div className={styles['form-group']}>
          <label>Файл *</label>
          <input
            ref={fileInputRef}
            type="file"
            accept={
              selectedFormat > 0
                ? `.${FORMAT_EXTENSIONS[selectedFormat]}`
                : '.fb2'
            }
            className={styles['file-input']}
            disabled={selectedFormat < 1}
          />
          <span className={styles['hint']}>Макс. 100 MB</span>
        </div>

        <button
          onClick={handleUpload}
          disabled={uploadMutation.isPending || selectedFormat <= 0}
          className={`${styles['btn']}`}
        >
          {uploadMutation.isPending ? 'Загрузка...' : 'Загрузить'}
        </button>
      </div>
      <AlertDialog
        description={`Это действие нельзя будет отменить, все сопутствующие фрагменты и данные будут также удалены`}
        open={deleteModalOpen}
        title={`Вы действительно хотите удалить этот файл книги?`}
        handleAccept={handleDelete}
        handleReject={() => {
          setDeleteModalOpen(false);
          setDeletingBookfile(0);
        }}
      />
      <div className={styles['files-list']}>
        <h4>Существующие файлы ({bookFiles?.length || 0})</h4>
        <table className={styles['files-table']}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Формат</th>
              <th>Размер</th>
              <th>Статус</th>
              <th>Тип</th>
              <th>Загружен</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {bookFiles?.map((file) => (
              <tr key={file.id}>
                <td>{file.id}</td>
                <td>{file.formatName}</td>
                <td>{file.fileSizeDisplay}</td>
                <td>{getStatusBadge(file.bookFileStatusId)}</td>
                <td>{file.isReadable ? 'Основной' : 'Для скачивания'}</td>
                <td>{new Date(file.createdAt).toLocaleDateString('ru-RU')}</td>
                <td style={{ gap: '20px' }}>
                  <button
                    onClick={() => handleDownload(file.id, file.formatId)}
                    disabled={
                      file.bookFileStatusId !== BookFileStatuses.COMPLETED
                    }
                  >
                    <Download style={{ cursor: 'pointer' }} />
                  </button>
                  <button
                    onClick={() => {
                      setDeletingBookfile(file.id);
                      setDeleteModalOpen(true);
                    }}
                    disabled={
                      deleteMutation.isPending || updateMutation.isPending
                    }
                  >
                    <Trash2 style={{ cursor: 'pointer' }} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
