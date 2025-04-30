// src/components/ToastProvider.js
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { v4 as uuid } from "uuid";

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

const TYPE_CLASSES = {
  success:
    "border-green-500 bg-white/70 backdrop-blur text-green-700 shadow-green-200",
  error:
    "border-red-500 bg-white/70 backdrop-blur text-red-700 shadow-red-200",
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message, type = "success") => {
    const id = uuid();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => remove(id), 3500);
  }, [remove]);

  const value = {
    success: (msg) => push(msg, "success"),
    error: (msg) => push(msg, "error"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-50 space-y-4">
        {toasts.map(({ id, message, type }) => (
          <div
            key={id}
            className={`flex max-w-xs animate-slide-in items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${TYPE_CLASSES[type]}`}
          >
            {type === "success" ? (
              <svg
                className="h-5 w-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            <span className="text-sm font-medium">{message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

