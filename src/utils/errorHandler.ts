import { Alert } from 'react-native';
import { ToastType } from '../components/Toast';

let toastHandler: ((message: string, type: ToastType) => void) | null = null;

export const setToastHandler = (handler: (message: string, type: ToastType) => void) => {
  toastHandler = handler;
};

export const showToast = (message: string, type: ToastType = 'info') => {
  if (toastHandler) {
    toastHandler(message, type);
  } else {
    // Fallback to Alert if toast handler not set
    Alert.alert(type.charAt(0).toUpperCase() + type.slice(1), message);
  }
};

export const handleError = (error: any, defaultMessage: string = 'An error occurred') => {
  console.error('Error:', error);

  let message = defaultMessage;

  if (error?.response?.data?.message) {
    message = error.response.data.message;
  } else if (error?.message) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  showToast(message, 'error');
};

export const handleSuccess = (message: string) => {
  showToast(message, 'success');
};

export const handleWarning = (message: string) => {
  showToast(message, 'warning');
};

export const handleInfo = (message: string) => {
  showToast(message, 'info');
};

export const confirmAction = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
) => {
  Alert.alert(
    title,
    message,
    [
      { text: 'Cancel', style: 'cancel', onPress: onCancel },
      { text: 'Confirm', onPress: onConfirm },
    ],
  );
};
