import React from 'react';

interface OutputCardProps {
  content: string;
  isVisible: boolean;
}

export const OutputCard: React.FC<OutputCardProps> = ({ content, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="h-full w-full">
      <pre className="w-full h-full whitespace-pre-wrap font-sans text-lg md:text-xl text-zinc-800 leading-relaxed telugu-text p-8 md:p-12 overflow-y-auto custom-scrollbar">
        {content}
      </pre>
    </div>
  );
};