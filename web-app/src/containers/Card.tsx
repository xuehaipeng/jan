import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

type CardProps = {
  title?: string
  children?: ReactNode
  header?: ReactNode
}

type CardItemProps = {
  title?: string | ReactNode
  description?: string | ReactNode
  descriptionOutside?: string | ReactNode
  align?: 'start' | 'center' | 'end'
  actions?: ReactNode
  column?: boolean
  className?: string
  classNameWrapperAction?: string
}

export function CardItem({
  title,
  description,
  descriptionOutside,
  className,
  classNameWrapperAction,
  align = 'center',
  column,
  actions,
}: CardItemProps) {
  return (
    <>
      <div
        className={cn(
          'flex justify-between mt-2 first:mt-0 border-b border-main-view-fg/5 pb-3 last:border-none last:pb-0 gap-8',
          descriptionOutside && 'border-0',
          align === 'start' && 'items-start',
          align === 'center' && 'items-center',
          align === 'end' && 'items-end',
          column && 'flex-col gap-y-0 items-start',
          className
        )}
      >
        <div className="space-y-1.5">
          <h1 className="font-medium">{title}</h1>
          {description && (
            <span className="text-main-view-fg/70 leading-normal">
              {description}
            </span>
          )}
        </div>
        {actions && (
          <div
            className={cn(
              'shrink-0',
              classNameWrapperAction,
              column && 'w-full'
            )}
          >
            {actions}
          </div>
        )}
      </div>
      {descriptionOutside && (
        <span className="text-main-view-fg/70 leading-normal">
          {descriptionOutside}
        </span>
      )}
    </>
  )
}

export function Card({ title, children, header }: CardProps) {
  return (
    <div className="bg-main-view-fg/3 p-4 rounded-lg text-main-view-fg/90 w-full">
      {title && (
        <h1 className="text-main-view-fg font-medium text-base mb-4">
          {title}
        </h1>
      )}
      {header && header}
      {children}
    </div>
  )
}
