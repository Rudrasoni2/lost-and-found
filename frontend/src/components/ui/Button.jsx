// src/components/ui/Button.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn'; // utility for classnames; fallback if not present

/**
 * Reusable button component.
 *
 * Props:
 * - children: button label/content
 * - onClick: click handler
 * - disabled: disables the button
 * - type: button | submit | reset (default: button)
 * - variant: "primary" | "secondary" (default: primary)
 * - className: additional Tailwind classes
 */
export const Button = ({
  children,
  onClick,
  disabled = false,
  type = 'button',
  variant = 'primary',
  className = '',
  ...rest
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-colors duration-200';
  const variants = {
    primary: 'bg-gradient-to-r from-deepIndigo to-electricCyan text-white hover:from-deepIndigo hover:to-electricCyan/90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-deepIndigo disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'bg-cardWhite text-mainText border border-secondaryText hover:bg-softBg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-deepIndigo disabled:opacity-50 disabled:cursor-not-allowed',
  };
  const classes = cn(baseClasses, variants[variant] ?? variants.primary, className);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      {...rest}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  variant: PropTypes.oneOf(['primary', 'secondary']),
  className: PropTypes.string,
};

export default Button;
