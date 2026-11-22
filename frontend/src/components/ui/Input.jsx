// src/components/ui/Input.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

/**
 * Reusable input component with label and optional error message.
 * Supports both <input> and <textarea> via the "as" prop.
 */
export const Input = ({
  id,
  label,
  name,
  value,
  onChange,
  placeholder = '',
  required = false,
  type = 'text',
  as = 'input', // 'input' or 'textarea'
  rows = 3, // only for textarea
  className = '',
  error = '',
  ...rest
}) => {
  const inputId = id || `input-${name}`;
  const baseClasses =
    'block w-full rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200';
  const inputClasses = cn(baseClasses, className);

  const InputElement = as === 'textarea' ? (
    <textarea
      id={inputId}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      required={required}
      className={inputClasses}
      {...rest}
    />
  ) : (
    <input
      id={inputId}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={inputClasses}
      {...rest}
    />
  );

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {InputElement}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

Input.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  type: PropTypes.string,
  as: PropTypes.oneOf(['input', 'textarea']),
  rows: PropTypes.number,
  className: PropTypes.string,
  error: PropTypes.string,
};

export default Input;
