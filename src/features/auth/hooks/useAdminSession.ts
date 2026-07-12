import { useContext } from 'react';
import { AdminSessionContext } from './adminSession.context';

export function useAdminSession() {
  const context = useContext(AdminSessionContext);

  if (!context) {
    throw new Error('useAdminSession must be used inside AdminSessionProvider');
  }

  return context;
}
