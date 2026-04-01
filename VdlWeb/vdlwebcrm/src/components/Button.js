import React from 'react';

function Button({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  variant = 'primary',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${className}`}
    >
      {children}
    </button>
  );
}

export default Button;
