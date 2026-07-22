import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-3/4 rounded-xl border border-2 px-4 py-3 flex items-start gap-3 m-auto",
  {
    variants: {
      // Filled accent card: a colored fill + matching border, with white
      // text/icon/title on top. The brand scale inverts across themes, so the
      // *-600 (light theme) / dark:*-200 (dark theme) fill stays a dark-enough
      // surface for white text to keep contrast in both modes.
      color: {
        emerald:
          "border-emerald-600 text-white bg-emerald-600 dark:bg-emerald-200 dark:border-emerald-200",
        primary:
          "border-primary-600 text-white bg-primary-600 dark:bg-primary-200 dark:border-primary-200",
        secondary:
          "border-secondary-600 text-white bg-secondary-600 dark:bg-secondary-200 dark:border-secondary-200",
        cyan: "border-cyan-800 text-white bg-cyan-800 dark:bg-cyan-800 dark:border-cyan-800",
        magenta:
          "border-viva-magenta-600 text-white bg-viva-magenta-600 dark:bg-viva-magenta-200 dark:border-viva-magenta-200",
      },
    },
    defaultVariants: {
      color: "emerald",
    },
  }
)

function Alert({
  className,
  color = "emerald",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="note"
      className={cn(alertVariants({ color }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("font-medium leading-tight", className)}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-foreground", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, alertVariants }
