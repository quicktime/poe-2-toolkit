interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  type?: 'error' | 'warning' | 'info';
}

export default function ErrorMessage({
  title = 'Error',
  message,
  onRetry,
  type = 'error',
}: ErrorMessageProps) {
  const typeStyles = {
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-300',
      icon: 'text-red-500',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-700 dark:text-yellow-300',
      icon: 'text-yellow-500',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-300',
      icon: 'text-blue-500',
    },
  };

  const styles = typeStyles[type];

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-lg p-4`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {type === 'error' && (
            <svg
              className={`h-5 w-5 ${styles.icon}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {type === 'warning' && (
            <svg
              className={`h-5 w-5 ${styles.icon}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {type === 'info' && (
            <svg
              className={`h-5 w-5 ${styles.icon}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${styles.text}`}>{title}</h3>
          <div className={`mt-1 text-sm ${styles.text}`}>
            <p>{message}</p>
          </div>
          {onRetry && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                className={`text-sm font-medium ${styles.text} hover:underline focus:outline-none`}
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}