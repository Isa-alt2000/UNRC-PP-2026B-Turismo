import { cva } from 'class-variance-authority'

export const buttonVariants = cva('btn', {
  variants: {
    variant: {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
    },
    size: {
      small: 'btn-sm',
      medium: '',
      large: 'btn-lg',
    },
  },
  defaultVariants: { variant: 'primary', size: 'medium' },
})
