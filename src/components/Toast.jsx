import { useNotification } from '../context/NotificationContext';
import styles from './Toast.module.css';

export default function Toast() {
  const { toasts } = useNotification();

  return (
    <div className={styles.toastContainer}>
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
