import { useNotification } from '../context/NotificationContext';
import styles from './ConfirmDialog.module.css';

export default function ConfirmDialog() {
  const { confirmDialog } = useNotification();

  if (!confirmDialog) return null;

  return (
    <div className={styles.overlay} onClick={confirmDialog.onCancel}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.message}>{confirmDialog.message}</div>
        <div className={styles.actions}>
          <button className={styles.confirmBtn} onClick={confirmDialog.onConfirm}>
            OK
          </button>
          <button className={styles.cancelBtn} onClick={confirmDialog.onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
