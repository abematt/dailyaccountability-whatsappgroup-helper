import { Card } from "@/components/ui/card";

export type UserId = "abraham" | "carlo" | "stefania";

interface User {
  id: UserId;
  name: string;
  initial: string;
}

const USERS: User[] = [
  { id: "abraham", name: "Abraham", initial: "A" },
  { id: "carlo", name: "Carlo", initial: "C" },
  { id: "stefania", name: "Stefania", initial: "S" },
];

interface UserPickerProps {
  onSelectUser: (userId: UserId) => void;
}

export function UserPicker({ onSelectUser }: UserPickerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent p-4">
      <div className="w-full max-w-lg space-y-6 rounded-3xl border border-white/60 bg-background/85 p-6 shadow-[0_28px_70px_-30px_rgba(15,23,42,0.55)] backdrop-blur-2xl sm:p-8">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Accountability</p>
          <h1 className="text-3xl font-semibold tracking-tight text-balance">Choose your profile</h1>
          <p className="text-sm text-muted-foreground">Your data stays scoped to the selected user.</p>
        </div>

        <div className="grid gap-3">
          {USERS.map((user) => (
            <Card
              key={user.id}
              className="elevated-card cursor-pointer p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_16px_36px_-22px_rgba(15,23,42,0.45)]"
              onClick={() => onSelectUser(user.id)}
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-transparent bg-primary shadow-[0_10px_20px_-12px_rgba(30,64,175,0.65)]"
                >
                  <span className="text-lg font-semibold tracking-wide text-primary-foreground">
                    {user.initial}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-semibold leading-tight">{user.name}</p>
                  <p className="text-xs text-muted-foreground">Tap to continue</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export { USERS };
