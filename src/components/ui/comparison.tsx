import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const comparisonCardVariants = cva(
  "flex flex-col gap-2 rounded-xl border p-4",
  {
    variants: {
      // Subtle tint: a low-opacity surface + a colored border, with the tone
      // color set on the card so the heading inherits it via currentColor. The
      // body opts back out to text-foreground (below) for readable contrast.
      // Tailwind v4 built-in palettes — no new tokens needed.
      tone: {
        positive:
          "border-emerald-500/40 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
        negative:
          "border-red-500/40 bg-red-500/5 text-red-600 dark:text-red-400",
        neutral:
          "border-primary-500/40 bg-primary-500/5 text-primary-700 dark:text-primary-400",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
)

function Comparison({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="comparison"
      className={cn("grid grid-cols-1 gap-4 md:grid-cols-2", className)}
      {...props}
    />
  )
}

function ComparisonCard({
  className,
  tone,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof comparisonCardVariants>) {
  return (
    <div
      data-slot="comparison-card"
      className={cn(comparisonCardVariants({ tone }), className)}
      {...props}
    />
  )
}

function ComparisonHeading({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="comparison-heading"
      className={cn("text-xs font-semibold uppercase tracking-wide", className)}
      {...props}
    />
  )
}

function ComparisonBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="comparison-body"
      className={cn("richtext text-foreground", className)}
      {...props}
    />
  )
}

export {
  Comparison,
  ComparisonCard,
  ComparisonHeading,
  ComparisonBody,
  comparisonCardVariants,
}
