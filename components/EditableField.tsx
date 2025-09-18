import React from 'react';

interface EditableFieldProps {
  value: string;
  isEditing: boolean;
  onChange: (newValue: string) => void;
  as?: 'p' | 'li'; // Allow rendering as a paragraph or list item
  className?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({ value, isEditing, onChange, as = 'p', className = '' }) => {
  const Tag = as;

  if (isEditing) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-2 border border-sky-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow duration-200 resize-none ${className}`}
        rows={Math.max(3, value.split('\n').length)} // Auto-adjust height
      />
    );
  }

  return (
    <Tag className={`whitespace-pre-wrap ${className}`}>
      {value}
    </Tag>
  );
};

export default EditableField;