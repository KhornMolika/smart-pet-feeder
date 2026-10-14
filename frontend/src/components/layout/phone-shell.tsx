'use client';

import React from 'react';

/**
 * @deprecated The simulated iPhone shell has been removed in favor of native responsive mobile layout.
 * This component is kept as a lightweight passthrough for backward compatibility.
 */
export function PhoneShell({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
