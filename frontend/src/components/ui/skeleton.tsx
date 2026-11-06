import { cn } from '@/lib/utils'

/** Bloque que late mientras carga el contenido que ocupará su lugar. */
export function Skeleton({ className }: { className?: string }) {
  return <span className={cn('sk block', className)} aria-hidden="true" />
}
