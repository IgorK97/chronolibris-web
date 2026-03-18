import { Reader } from '@/components/Reader';
import { Navigate, useParams } from 'react-router-dom';

export const ReaderPage: React.FC = () => {
  const { bookFileId } = useParams<{ bookFileId: string }>();

  const id = Number(bookFileId);
  if (!bookFileId || isNaN(id)) return <Navigate to="/" replace />;

  return <Reader bookFileId={id} />;
};
