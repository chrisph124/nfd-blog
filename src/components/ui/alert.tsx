import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border bg-transparent px-4 py-3 flex items-start gap-3",
  {
    variants: {
      // Accent colors drive the border, icon and title (via currentColor). The
      // description opts out to text-foreground for WCAG-AA body contrast. Each
      // *-400/dark:*-500 pair resolves to the same hex across themes (brand
      // scales invert), so the accent looks identical in light and dark.
      color: {
        emerald:
          "border-emerald-400 text-emerald-400 dark:border-emerald-500 dark:text-emerald-500",
        primary:
          "border-primary-400 text-primary-400 dark:border-primary-500 dark:text-primary-500",
        secondary:
          "border-secondary-400 text-secondary-400 dark:border-secondary-500 dark:text-secondary-500",
        cyan: "border-neon-cyan-400 text-neon-cyan-400 dark:border-neon-cyan-500 dark:text-neon-cyan-500",
        magenta:
          "border-viva-magenta-400 text-viva-magenta-400 dark:border-viva-magenta-500 dark:text-viva-magenta-500",
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
