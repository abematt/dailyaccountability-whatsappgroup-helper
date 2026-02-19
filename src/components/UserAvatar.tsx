import { USERS, type UserId } from "./UserPicker";

interface UserAvatarProps {
  userId: UserId;
  inline?: boolean;
  className?: string;
}

export function UserAvatar({ userId, inline = false, className = "" }: UserAvatarProps) {
  const user = USERS.find((u) => u.id === userId);

  if (!user) return null;

  if (inline) {
    return (
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 shadow-[0_10px_20px_-12px_rgba(15,23,42,0.45)] ${className}`}
        style={{ backgroundColor: user.color }}
        title={user.name}
      >
        <span className="text-sm font-semibold tracking-wide text-white">
          {user.initial}
        </span>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6 ${className}`}>
      <div
        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 shadow-[0_12px_24px_-12px_rgba(15,23,42,0.5)] backdrop-blur-sm sm:h-11 sm:w-11"
        style={{ backgroundColor: user.color }}
      >
        <span className="text-sm font-semibold tracking-wide text-white">
          {user.initial}
        </span>
      </div>
    </div>
  );
}
