import React from 'react';
import { Divider } from './Divider';
import type { DividerProps } from './Divider';

export type AsciiDividerProps = DividerProps;

/**
 * @deprecated Use {@link Divider}. This name described the mark (`//====//`),
 * which is only the mark the *dark* levels draw — the light levels draw a
 * pencil rule. `Divider` names the role instead, and picks the mark from the
 * level's polarity.
 *
 * Kept as a thin alias so existing call sites keep compiling. Note that the
 * bare `.ascii-divider` class is gone: it existed only as a hook for a
 * consumer's `::after`, and that behaviour is now a variant on `Divider`.
 * Anything rendering `<div className="ascii-divider" />` directly must render
 * the component instead.
 */
export const AsciiDivider: React.FC<AsciiDividerProps> = (props) => <Divider {...props} />;
