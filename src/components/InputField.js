import React from 'react';
import '../styles/global.css';

const InputField = ({ label, type, value, onChange, placeholder, required, min, step }) => {
  return (
    <div className="input-field">
      <label>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        step={step}
      />

      <style jsx>{`
        .input-field {
          margin-bottom: 15px;
        }

        label {
          display: block;
          margin-bottom: 5px;
          color: var(--text-color);
          font-weight: bold;
        }

        input {
          width: 100%;
          padding: 10px;
          border: 1px solid var(--accent-color);
          border-radius: 4px;
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
          font-size: 16px;
        }

        input:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 5px var(--accent-color);
        }

        input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default InputField; 