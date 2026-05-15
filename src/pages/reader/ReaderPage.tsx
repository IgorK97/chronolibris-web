import { Reader } from './Reader';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

export const ReaderPage: React.FC = () => {
  const { bookFileId } = useParams();
  const navigate = useNavigate();
  const id = Number(bookFileId);
  if (!bookFileId || isNaN(id)) return <Navigate to="/" replace />;

  return <Reader bookFileId={id} onBack={() => navigate(-1)} />;
};
