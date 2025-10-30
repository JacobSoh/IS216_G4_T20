import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-100 disabled:brightness-95 disabled:saturate-75 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-[var(--theme-surface)] text-[var(--theme-surface-contrast)] border border-[var(--theme-border)] hover:bg-[color:var(--theme-surface)]/90",
        brand:
          "bg-[var(--theme-primary)] text-white hover:bg-[var(--theme-secondary)] focus-visible:ring-[color:var(--theme-secondary)]/40",
        gold_white:
          "bg-[var(--theme-gold)] text-foreground hover:bg-[var(--theme-gold)] hover:bg-[#F0E68C]",
        gold:
          "bg-[var(--theme-gold)]  text-[var(--theme-primary)] hover:bg-[var(--theme-gold)] hover:bg-[#F0E68C]",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        info:
          "bg-blue-500 text-white hover:bg-blue-300 focus-visible:ring-blue-400/40 dark:focus-visible:ring-blue-500/50",
        success:
          "bg-green-500 text-white hover:bg-green-300 focus-visible:ring-green-400/40 dark:focus-visible:ring-green-500/50",
        warning:
          "bg-amber-500 text-black hover:bg-amber-300 hover:text-white focus-visible:ring-amber-400/40 dark:focus-visible:ring-amber-500/50",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-gray-500 text-white hover:bg-gray-700 focus-visible:ring-gray-300/40 dark:focus-visible:ring-gray-500/50 disabled:bg-gray-800",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-[var(--theme-secondary)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  isLoading,
  loadingOnClick = false,
  spinnerClassName,
  onClick,
  disabled,
  children,
  ...props
}) {
  const Comp = asChild ? Slot : "button"

  const [internalLoading, setInternalLoading] = React.useState(false)
  const loading = (isLoading ?? internalLoading) === true

  const handleClick = React.useCallback(async (e) => {
    if (!onClick) return
    if (!loadingOnClick) {
      return onClick(e)
    }

    if (loading) return
    try {
      const maybePromise = onClick(e)
      if (maybePromise && typeof maybePromise.then === "function") {
        setInternalLoading(true)
        await maybePromise
      }
    } finally {
      setInternalLoading(false)
    }
  }, [onClick, loadingOnClick, loading])

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner className={cn("shrink-0", spinnerClassName)} /> : null }
      {children}
    </Comp>
  );
}

export { Button, buttonVariants }
