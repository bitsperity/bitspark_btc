/**
 * BitSpark Design System - TypeScript Types
 * 
 * Centralized type definitions for all UI components.
 * Ensures type safety and consistency across the application.
 */

import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLButtonAttributes, HTMLInputAttributes } from 'svelte/elements';

// ============================================
// VARIANT TYPES
// ============================================

export type ButtonVariant = 'primary' | 'ghost' | 'glass';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type BadgeVariant = 'default' | 'primary' | 'gold' | 'success' | 'error';

export type CardVariant = 'default' | 'glow';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'search' | 'url';

// ============================================
// COMPONENT PROPS
// ============================================

export interface ButtonProps extends Omit<HTMLButtonAttributes, 'class'> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: boolean;
    class?: string;
    children: Snippet;
}

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'class'> {
    variant?: BadgeVariant;
    class?: string;
    children: Snippet;
}

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'class'> {
    variant?: CardVariant;
    class?: string;
    children: Snippet;
}

export interface AvatarProps {
    src?: string;
    alt?: string;
    fallback?: string;
    size?: AvatarSize;
    class?: string;
}

export interface InputProps extends Omit<HTMLInputAttributes, 'class'> {
    label?: string;
    error?: string;
    class?: string;
}

export interface TextareaProps {
    label?: string;
    error?: string;
    placeholder?: string;
    rows?: number;
    value?: string;
    class?: string;
}

export interface NavItemProps {
    href: string;
    label: string;
    active?: boolean;
    icon: Snippet;
}

export interface NavbarProps {
    items: NavItemProps[];
    class?: string;
}

export interface ContainerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'class'> {
    class?: string;
    children: Snippet;
}

export interface StackProps extends Omit<HTMLAttributes<HTMLDivElement>, 'class'> {
    gap?: 1 | 2 | 3 | 4 | 6 | 8;
    class?: string;
    children: Snippet;
}

export interface RowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'class'> {
    gap?: 1 | 2 | 3 | 4 | 6;
    align?: 'start' | 'center' | 'end' | 'stretch';
    justify?: 'start' | 'center' | 'end' | 'between' | 'around';
    wrap?: boolean;
    class?: string;
    children: Snippet;
}

// ============================================
// ICON PROPS (for Lucide wrapper)
// ============================================

export interface IconProps {
    size?: number;
    strokeWidth?: number;
    class?: string;
}

// ============================================
// UTILITY TYPES
// ============================================

/** Merge two types, with the second overriding the first */
export type Merge<T, U> = Omit<T, keyof U> & U;

/** Make specific keys required */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** Extract props type from a component */
export type ComponentProps<T> = T extends new (...args: any[]) => { $props: infer P } ? P : never;
