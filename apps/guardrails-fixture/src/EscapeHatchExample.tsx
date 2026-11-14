import React from 'react';

/**
 * EscapeHatchExample.tsx
 * Demonstrates the 3rd tier of the design system escape hatch architecture:
 * In-code suppression MUST carry a structured explanation matching:
 *   -- ESCAPE_HATCH(<domain>): <explanation>
 */
export const EscapeHatchExample: React.FC = () => {
  return (
    <div className="w-full space-y-4">
      {/* Valid Escape Hatch: Aspect ratio and fixed dimension for 3D viewer */}
      {/* eslint-disable-next-line shadcn/no-arbitrary-values -- ESCAPE_HATCH(webgl): Fixed pixel viewport required by WebGL context */}
      <div className="h-[480px] w-full bg-surface-sunken border border-subtle">
        <canvas className="w-full h-full" />
      </div>
    </div>
  );
};
