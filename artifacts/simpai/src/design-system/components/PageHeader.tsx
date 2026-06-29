import React from 'react';

export function PageHeader({ title, description, rightElement }: { title: string, description?: string, rightElement?: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F5132] tracking-tight">{title}</h1>
        {description && (
          <p className="text-[#0F5132]/70 mt-1 text-sm md:text-base font-medium">{description}</p>
        )}
      </div>
      {rightElement && (
        <div>{rightElement}</div>
      )}
    </div>
  );
}
