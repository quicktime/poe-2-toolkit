/**
 * Toast Hook
 * Simple toast notification system
 */

import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToasterToast extends Toast {
  action?: React.ReactNode;
}

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

type ToasterState = {
  toasts: ToasterToast[];
};

const listeners: Array<(state: ToasterState) => void> = [];

let memoryState: ToasterState = { toasts: [] };

function dispatch(action: {
  type: 'ADD_TOAST' | 'UPDATE_TOAST' | 'DISMISS_TOAST' | 'REMOVE_TOAST';
  toast?: ToasterToast;
  toastId?: string;
}) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

function reducer(state: ToasterState, action: any): ToasterState {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, 5),
      };

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast?.id ? { ...t, ...action.toast } : t
        ),
      };

    case 'DISMISS_TOAST': {
      const { toastId } = action;

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId ? { ...t, open: false } : t
        ),
      };
    }

    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };

    default:
      return state;
  }
}

function toast({ ...props }: Omit<ToasterToast, 'id'>) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: 'UPDATE_TOAST',
      toast: { ...props, id },
    });

  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = useState<ToasterState>(memoryState);

  useCallback(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  };
}

export { useToast, toast };
