// src/utils/cn.js
/**
 * Simple class name concatenation utility.
 * Filters out falsy values and joins the rest with spaces.
 *
 * Example:
 *   cn('p-4', condition && 'bg-red-500') // => 'p-4 bg-red-500' (if condition true)
 */
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export default cn;
