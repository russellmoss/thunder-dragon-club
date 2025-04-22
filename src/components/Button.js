import React from 'react';
import '../styles/global.css';

const Button = ({ text, onClick, type = 'button', disabled = false, className = '' }) => {
  return (
    <button 
      className={`button ${className}`}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      {text}
    </button>
  );
};

export default Button; 