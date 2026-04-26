import { Alert } from 'react-native';

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

  Alert.alert('Error', message);
};

export const handleSuccess = (message: string) => {
  Alert.alert('Success', message);
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
