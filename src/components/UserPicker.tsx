import { Card } from "@/components/ui/card";

export type UserId = "abraham" | "carlo" | "stefania";

interface User {
  id: UserId;
  name: string;
  initial: string;
  color: string;
}

const USERS: User[] = [
  { id: "abraham", name: "Abraham", initial: "A", color: "#3b82f6" }, // blue-500
  { id: "carlo", name: "Carlo", initial: "C", color: "#22c55e" }, // green-500
  { id: "stefania", name: "Stefania", initial: "S", color: "#a855f7" }, // purple-500
];

interface UserPickerProps {
  onSelectUser: (userId: UserId) => void;
}

export function UserPicker({ onSelectUser }: UserPickerProps) {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Welcome!</h1>
          <p className="text-muted-foreground">Who are you?</p>
        </div>

        <div className="grid gap-3">
          {USERS.map((user) => (
            <Card
              key={user.id}
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onSelectUser(user.id)}
            >
              <div className="flex items-center gap-4">
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: user.color }}
                >
                  <span className="text-white text-lg font-semibold">
                    {user.initial}
                  </span>
                </div>
                <span className="text-lg font-medium">{user.name}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export { USERS };
