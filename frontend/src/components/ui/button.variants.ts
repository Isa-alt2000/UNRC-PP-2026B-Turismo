import { cva } from 'class-variance-authority'

export const buttonVariants = cva('btn', {
  variants: {
    variant: {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
    },
    size: {
      medium: '',
      large: 'btn-lg',
    },
  },
  defaultVariants: { variant: 'primary', size: 'medium' },
})
