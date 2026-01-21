"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors={true}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--background)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",

          /* Variant colors (richColors=true uses these) */
          "--success-bg": "#ecfdf5",
          "--success-text": "#166534",
          "--info-bg": "#eff6ff",
          "--info-text": "#1e40af",
          "--warning-bg": "#fffbeb",
          "--warning-text": "#92400e",
          /* Make errors red by default */
          "--error-bg": "#fee2e2",
          "--error-text": "#b91c1c",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
