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
        className={`flex h-10 w-10 items-center justify-center rounded-2xl border border-transparent bg-primary shadow-[0_10px_20px_-12px_rgba(30,64,175,0.65)] ${className}`}
        title={user.name}
      >
        <span className="text-sm font-semibold tracking-wide text-primary-foreground">
          {user.initial}
        </span>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6 ${className}`}>
      <div
        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-transparent bg-primary shadow-[0_10px_20px_-12px_rgba(30,64,175,0.65)] backdrop-blur-sm sm:h-11 sm:w-11"
      >
        <span className="text-sm font-semibold tracking-wide text-primary-foreground">
          {user.initial}
        </span>
      </div>
    </div>
  );
}
