import { USERS, type UserId } from "./UserPicker";

interface UserAvatarProps {
  userId: UserId;
}

export function UserAvatar({ userId }: UserAvatarProps) {
  const user = USERS.find((u) => u.id === userId);

  if (!user) return null;

  return (
    <div className="fixed top-4 right-4 z-40">
      <div
        className="h-10 w-10 rounded-full flex items-center justify-center shadow-lg"
        style={{ backgroundColor: user.color }}
      >
        <span className="text-white font-semibold text-sm">
          {user.initial}
        </span>
      </div>
    </div>
  );
}
