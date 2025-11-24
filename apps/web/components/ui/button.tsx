import * as React from 'react';
import styles from './button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'sm' | 'default' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    const classes = [
      styles.button,
      styles[`button--${size}`],
      styles[`button--${variant}`],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return <button className={classes} ref={ref} {...props} />;
  }
);

Button.displayName = 'Button';

export { Button };
