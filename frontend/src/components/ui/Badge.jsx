// src/components/ui/Badge.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

/**
 * Badge component for status, categories, etc.
 *
 * Props:
 * - children: label
 * - variant: "primary" | "secondary" | "success" | "danger" | "info" (default: primary)
 * - className: additional Tailwind classes
 */
export const Badge = ({ children, variant = 'primary', className = '' }) => {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors duration-200';
  const variants = {
    primary: 'bg-indigo-100 text-indigo-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };
  const classes = cn(base, variants[variant] ?? variants.primary, className);
  return <span className={classes}>{children}</span>;
};

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'info']),
  className: PropTypes.string,
};

export default Badge;
