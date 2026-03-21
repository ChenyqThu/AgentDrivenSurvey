"use client";

/**
 * AI Avatar Orb — shared across chat header, message list, welcome, completion.
 * Uses generated image assets with CSS gradient fallback.
 * Automatically switches between light/dark variants.
 */

interface AvatarOrbProps {
  /** Size in pixels */
  size?: number;
  /** Enable breathing glow animation */
  breathing?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function AvatarOrb({ size = 32, breathing = true, className = "" }: AvatarOrbProps) {
  return (
    <div
      className={`rounded-full flex-shrink-0 relative overflow-hidden ${breathing ? "avatar-breathe" : ""} ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Light mode image */}
      <img
        src="/images/agent-avatar.png"
        alt=""
        width={size}
        height={size}
        className="absolute inset-0 w-full h-full object-cover dark:hidden"
        draggable={false}
      />
      {/* Dark mode image */}
      <img
        src="/images/agent-avatar-dark.png"
        alt=""
        width={size}
        height={size}
        className="absolute inset-0 w-full h-full object-cover hidden dark:block"
        draggable={false}
      />
      {/* CSS gradient fallback (shows while images load) */}
      <div
        className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-[#3B5BDB] to-[#F59F00] -z-10"
      />
    </div>
  );
}
