import { Outlet } from 'react-router-dom';

export default function ReaderLayout() {
  return (
    <div className="app-container light">
      <Outlet />
    </div>
  );
}
