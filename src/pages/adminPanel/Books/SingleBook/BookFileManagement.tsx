/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from 'react';
import {
  useBookFiles,
  useUploadBookFile,
  useDeleteBookFile,
  // useDownloadBookFile,
  useDownloadBookFile,
} from '@/api/bookFiles';
import { useFormats } from '@/api/references';
import type { BookFileDto } from '@/types';
import { BookFileStatuses } from '@/types';
import styles from './BookFileManagement.module.css';
import { Download, Trash2 } from 'lucide-react';
import { t } from 'i18next';
import { AlertDialog } from '@/components/dialogs/AlertDialog';
import Circles from 'react-loading-icons/dist/esm/components/circles';

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
};

interface BookFileManagementProps {
  bookId: number;
  bookTitle: string;
}

const FORMAT_EXTENSIONS: Record<number, string> = {
  1: 'fb2',
  2: 'epub',
};

interface TextType {
  id: number;
  name: string;
}

const TextTypes: TextType[] = [
  {
    id: 1,
    name: 'Исходный исторический текст',
  },
  { id: 2, name: 'Обработанный исторический текст' },
  { id: 3, name: 'Обычный текст' },
];

export const BookFileManagement: React.FC<BookFileManagementProps> = ({
  bookId,
  bookTitle,
}) => {
  const {
    data: bookFiles,
    isLoading,
    error,
    refetch,
  } = useBookFiles(bookId, true);
  const { data: formats } = useFormats();
  const uploadMutation = useUploadBookFile();
  const { mutateAsync: deleteAsync, isPending: isDeleting } =
    useDeleteBookFile();
  // const downloadMutation = useDownloadBookFile();
  // const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [deletingBookfile, setDeletingBookfile] = useState<number>(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [hasFile, setHasFile] = useState<boolean>(false);
  const [selectedFormat, setSelectedFormat] = useState<number>(0);
  const [selectedTextType, setSelectedTextType] = useState<number>(0);
  const [isReadable, setIsReadable] = useState<boolean>(false);
  const [editingFile, setEditingFile] = useState<BookFileDto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // const editFileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: download, isPending: isDownloading } =
    useDownloadBookFile();

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      alert('Выберите файл для загрузки');
      return;
    }

    if (selectedFormat <= 0) {
      alert('Выберите формат файла');
      return;
    }

    if (selectedTextType <= 0) {
      alert('Выберите тип текста');
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
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert('Размер файла не должен превышать 50 MB');
      return;
    }

    let resultTextType;
    if (selectedTextType == 1) resultTextType = true;
    else if (selectedTextType == 2) resultTextType = false;
    else resultTextType = null;

    try {
      await uploadMutation.mutateAsync({
        bookId,
        formatId: selectedFormat,
        isReadable,
        file,
        historicalText: resultTextType,
      });

      setSelectedFormat(0);
      setIsReadable(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setHasFile(false);
      refetch();
    } catch (err: any) {
      // alert(err.response?.data?.message || 'Ошибка загрузки файла');
    }
  };

  const handleDelete = async () => {
    setDeleteModalOpen(false);
    await deleteAsync(deletingBookfile);
    refetch();
  };

  const handleDownload = async (bookFileId: number, formatId: number) => {
    if (!bookFileId) return;
    // setIsDownloading(true);
    setDownloadError(null);
    let a;
    let url;
    try {
      const { blob } = await download(bookFileId);
      if (!blob) throw new Error('Файл не найден');
      url = window.URL.createObjectURL(blob);
      a = document.createElement('a');
      a.href = url;
      let extension = FORMAT_EXTENSIONS[formatId] || '';
      if (extension === 'fb2') extension += '.zip';
      a.download = `${bookTitle}.${extension}`;
      document.body.appendChild(a);
      a.click();
    } catch (error) {
      let errorMessage = t('book.download_error');
      if (error instanceof Error) errorMessage += error.message;
      setDownloadError(errorMessage);
    } finally {
      if (a) {
        document.body.removeChild(a);
      }
      if (url) {
        window.URL.revokeObjectURL(url);
      }
    }
  };

  const getStatusBadge = (statusId: number) => {
    const statusMap: Record<number, { label: string; color: string }> = {
      [BookFileStatuses.PENDING]: { label: 'Ожидание', color: '#32384B' },
      [BookFileStatuses.UPLOADED]: { label: 'Загружен', color: '#946D4B' },
      [BookFileStatuses.PROCESSING]: { label: 'Обработка', color: '#394264' },

      [BookFileStatuses.FAILED]: { label: 'Ошибка', color: '#dc3545' },
      [BookFileStatuses.COMPLETED]: {
        label: 'Готов к чтению',
        color: '#2F5C57',
      },
      [BookFileStatuses.ARCHIVE]: { label: 'Архив', color: '#6F4F46' },
    };

    const status = statusMap[statusId] || null;

    return (
      status && (
        <span
          className={styles['status-badge']}
          style={{ backgroundColor: status.color }}
        >
          {status.label}
        </span>
      )
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
          <label>Формат</label>
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
          <label>Файл</label>
          <input
            ref={fileInputRef}
            type="file"
            accept={
              selectedFormat > 0
                ? `.${FORMAT_EXTENSIONS[selectedFormat]}`
                : '.fb2'
            }
            onChange={(e) => setHasFile((e.target.files?.length ?? 0) > 0)}
            className={styles['file-input']}
            disabled={selectedFormat < 1}
          />
          <span className={styles['hint']}>Макс. 50 MB</span>
        </div>

        <div className={styles['form-group']}>
          <label>Тип текста</label>
          <select
            value={selectedTextType}
            onChange={(e) => {
              const formatId = Number(e.target.value);
              setSelectedTextType(formatId);
            }}
            className={styles['input-field']}
          >
            <option value={0}>Укажите тип</option>
            {TextTypes?.map((format) => (
              <option key={format.id} value={format.id}>
                {format.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <button
            onClick={handleUpload}
            style={{ marginRight: '10px' }}
            disabled={
              uploadMutation.isPending || selectedFormat <= 0 || !hasFile
            }
            className={styles['btn']}
          >
            {uploadMutation.isPending ? 'Загрузка...' : 'Загрузить'}
          </button>
          {uploadMutation.isPending && <Circles width={50} fill="#d32f2f" />}
        </div>
      </div>
      <AlertDialog
        description={`Это действие нельзя будет отменить. Если файл не находится в архивном состоянии, он будет переведен в архивное состояние и доступен только администраторам, модераторам и тем читателям, что
          имеют закладки для данного файла. Если файл в архивном состоянии, все сопутствующие фрагменты и данные в файловом хранилище будут окончательно удалены вместе с самим файлом, 
          а состояние файла будет изменено на удаленное.`}
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
        {(isDownloading || isDeleting) && <Circles width={50} fill="#d32f2f" />}
        <table className={styles['files-table']}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Формат</th>
              <th>Размер исходного файла</th>
              <th>Статус</th>
              <th>Тип</th>
              <th>Тип текста</th>
              <th>Загружен</th>
              <th>Скрыт</th>
              <th>Удален</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {bookFiles?.map((file) => (
              <tr key={file.id}>
                <td>{file.id}</td>
                <td>{file.formatName}</td>
                <td>{formatFileSize(file.fileSizeBytes)}</td>
                <td>{getStatusBadge(file.bookFileStatusId)}</td>
                <td>{file.isReadable ? 'Основной' : 'Для скачивания'}</td>
                <td>
                  {file.historicalText === true
                    ? 'Текст в исходном историческом виде'
                    : file.historicalText === false
                      ? 'Обработанный текст (современная орфография)'
                      : 'Обычный'}
                </td>
                <td>{new Date(file.createdAt).toLocaleDateString('ru-RU')}</td>
                <td>
                  {file.hiddenAt
                    ? new Date(file.hiddenAt).toLocaleDateString('ru-RU')
                    : '-'}
                </td>
                <td>
                  {file.deletedAt
                    ? new Date(file.createdAt).toLocaleDateString('ru-RU')
                    : '-'}
                </td>
                <td style={{ gap: '20px' }}>
                  <button
                    onClick={() => handleDownload(file.id, file.formatId)}
                    disabled={
                      file.bookFileStatusId != BookFileStatuses.ARCHIVE &&
                      file.bookFileStatusId != BookFileStatuses.COMPLETED
                    }
                  >
                    <Download
                      style={{
                        cursor: 'pointer',
                        opacity:
                          file.bookFileStatusId == BookFileStatuses.ARCHIVE ||
                          file.bookFileStatusId == BookFileStatuses.COMPLETED
                            ? 1.0
                            : 0.4,
                      }}
                    />
                  </button>
                  <button
                    onClick={() => {
                      setDeletingBookfile(file.id);
                      setDeleteModalOpen(true);
                    }}
                    disabled={
                      isDeleting ||
                      file.bookFileStatusId == BookFileStatuses.DELETED
                    }
                  >
                    <Trash2
                      style={{
                        cursor: 'pointer',
                        opacity:
                          file.bookFileStatusId != BookFileStatuses.DELETED
                            ? 1.0
                            : 0.4,
                      }}
                    />
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
