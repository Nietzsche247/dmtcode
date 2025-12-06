import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { useEffect } from "react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

// Announce toast messages to screen readers via ARIA live region
const announceToScreenReader = (message: string) => {
  const announcer = document.getElementById('aria-live-announcer');
  if (announcer) {
    announcer.textContent = message;
    // Clear after announcement to allow repeat announcements
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  }
};

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground min-h-[44px] min-w-[44px]",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground min-h-[44px] min-w-[44px]",
        },
      }}
      {...props}
    />
  );
};

// Enhanced toast function with screen reader announcements
const accessibleToast = Object.assign(
  (message: string | React.ReactNode, data?: Parameters<typeof toast>[1]) => {
    if (typeof message === 'string') {
      announceToScreenReader(message);
    }
    return toast(message, data);
  },
  {
    success: (message: string | React.ReactNode, data?: Parameters<typeof toast.success>[1]) => {
      if (typeof message === 'string') {
        announceToScreenReader(`Success: ${message}`);
      }
      return toast.success(message, data);
    },
    error: (message: string | React.ReactNode, data?: Parameters<typeof toast.error>[1]) => {
      if (typeof message === 'string') {
        announceToScreenReader(`Error: ${message}`);
      }
      return toast.error(message, data);
    },
    warning: (message: string | React.ReactNode, data?: Parameters<typeof toast.warning>[1]) => {
      if (typeof message === 'string') {
        announceToScreenReader(`Warning: ${message}`);
      }
      return toast.warning(message, data);
    },
    info: (message: string | React.ReactNode, data?: Parameters<typeof toast.info>[1]) => {
      if (typeof message === 'string') {
        announceToScreenReader(`Info: ${message}`);
      }
      return toast.info(message, data);
    },
    loading: toast.loading,
    dismiss: toast.dismiss,
    promise: toast.promise,
    custom: toast.custom,
  }
);

export { Toaster, accessibleToast as toast };
