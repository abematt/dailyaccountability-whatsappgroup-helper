import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IconPlus, IconTrash, IconCheck, IconCopy, IconHistory, IconPencil, IconX, IconArrowLeft } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { WeeklyHistoryView } from "./WeeklyHistoryView";
import { UserAvatar } from "./UserAvatar";
import type { UserId } from "./UserPicker";

type EmojiType = "green" | "yellow" | "red" | null;

interface WeeklyItem {
  text: string;
  emoji: EmojiType;
  explanation?: string;
  carriedOver?: boolean;
}

interface WeeklyGoalsAppProps {
  userId: UserId;
  onBack: () => void;
}

export function WeeklyGoalsApp({ userId, onBack }: WeeklyGoalsAppProps) {
  const weeklyGoals = useQuery(api.weeklyGoals.getCurrentWeekGoals, { userId });
  const initializeWeek = useMutation(api.weeklyGoals.initializeCurrentWeek);
  const upsertGoals = useMutation(api.weeklyGoals.upsertCurrentWeekGoals);
  const markCompleted = useMutation(api.weeklyGoals.markCurrentWeekCompleted);
  const revertToDraft = useMutation(api.weeklyGoals.revertCurrentWeekToDraft);
  const updateEmojis = useMutation(api.weeklyGoals.updateWeekItemsWithEmojis);

  const [items, setItems] = React.useState<WeeklyItem[]>([]);
  const [newItemText, setNewItemText] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [editingText, setEditingText] = React.useState("");

  // Initialize week if it doesn't exist
  React.useEffect(() => {
    if (weeklyGoals === null) {
      initializeWeek({ userId });
    }
  }, [weeklyGoals, initializeWeek, userId]);

  // Load weekly goals when fetched
  React.useEffect(() => {
    if (weeklyGoals?.items) {
      setItems(weeklyGoals.items);
    }
  }, [weeklyGoals]);

  const isCompleted = weeklyGoals?.status === "completed";

  // Format week display
  const formatWeekDisplay = () => {
    if (!weeklyGoals) return "";

    const startDate = new Date(weeklyGoals.weekStart + "T00:00:00");
    const endDate = new Date(weeklyGoals.weekEnd + "T00:00:00");

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const startDay = startDate.getDate();
    const startMonth = monthNames[startDate.getMonth()];

    const endDay = endDate.getDate();
    const endMonth = monthNames[endDate.getMonth()];

    return `Week ${weeklyGoals.weekNumber} - ${startDay} ${startMonth} - ${endDay} ${endMonth}`;
  };

  const handleAddItem = () => {
    if (newItemText.trim() && userId) {
      const newItem: WeeklyItem = {
        text: newItemText.trim(),
        emoji: null,
      };

      const newItems = [...items, newItem];
      setItems(newItems);
      setNewItemText("");
      upsertGoals({ userId, items: newItems, status: "draft" });
    }
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    upsertGoals({ userId, items: newItems, status: weeklyGoals?.status || "draft" });
  };

  const handleEditItem = (index: number) => {
    setEditingIndex(index);
    setEditingText(items[index].text);
  };

  const handleSaveEdit = (index: number) => {
    if (editingText.trim() && userId) {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], text: editingText.trim() };
      setItems(newItems);
      upsertGoals({ userId, items: newItems, status: weeklyGoals?.status || "draft" });
    }
    setEditingIndex(null);
    setEditingText("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingText("");
  };

  const handleMarkCompleted = async () => {
    await markCompleted({ userId });
  };

  const handleRevertToDraft = async () => {
    await revertToDraft({ userId });
  };

  const handleEmojiClick = (index: number, emoji: EmojiType) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], emoji };

    // Clear explanation if not yellow
    if (emoji !== "yellow") {
      delete newItems[index].explanation;
    }

    setItems(newItems);
    updateEmojis({ userId, items: newItems });
  };

  const handleExplanationChange = (index: number, explanation: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], explanation };
    setItems(newItems);
  };

  const handleSaveExplanation = () => {
    updateEmojis({ userId, items });
  };

  const getEmojiDisplay = (emoji: EmojiType) => {
    switch (emoji) {
      case "green":
        return "🟢";
      case "yellow":
        return "🟡";
      case "red":
        return "🔴";
      default:
        return "";
    }
  };

  const formatForWhatsApp = () => {
    if (!weeklyGoals) return "";

    const suffix = isCompleted ? "Update" : "Goals";
    let formatted = `*${formatWeekDisplay()} - ${suffix}*\n\n`;

    items.forEach((item, index) => {
      const emoji = getEmojiDisplay(item.emoji);
      const explanation = item.emoji === "yellow" && item.explanation
        ? ` (${item.explanation})`
        : "";
      // Use emoji as prefix if completed, otherwise use numbering
      const prefix = isCompleted && emoji ? emoji : `${index + 1}.`;
      formatted += `${prefix} ${item.text}${explanation}\n`;
    });

    return formatted.trim();
  };

  const handleCopy = async () => {
    const formatted = formatForWhatsApp();
    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (showHistory) {
    return <WeeklyHistoryView userId={userId} onBack={() => setShowHistory(false)} />;
  }

  return (
    <div className="flex flex-col h-screen bg-muted/30">
      {/* User Avatar Badge */}
      <UserAvatar userId={userId} />
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full min-h-0">
        {/* Header - Fixed */}
        <div className="p-4 bg-background border-b shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={onBack}
              className="h-8 w-8 shrink-0"
            >
              <IconArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold tracking-tight">Weekly Goals</h1>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">{formatWeekDisplay()}</p>
            </div>
            {weeklyGoals?.status && (
              <Badge variant={isCompleted ? "default" : "secondary"} className="shrink-0">
                {isCompleted ? "Completed" : "Draft"}
              </Badge>
            )}
          </div>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {/* Add Item Section - Only show in draft mode */}
          {!isCompleted && (
            <div className="space-y-2">
              {/* Add Item Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a new goal..."
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                  className="text-base h-12"
                />
                <Button onClick={handleAddItem} size="icon" className="shrink-0 h-12 w-12">
                  <IconPlus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Items List */}
          {items.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-center text-muted-foreground text-sm">
                No goals yet. Add your first goal to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {items.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <span className="font-semibold text-muted-foreground min-w-6 text-base shrink-0 mt-0.5">
                        {index + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        {editingIndex === index ? (
                          <div className="flex gap-2 items-center mb-1">
                            <Input
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit(index);
                                if (e.key === "Escape") handleCancelEdit();
                              }}
                              autoFocus
                              className="text-base h-9"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleSaveEdit(index)}
                              className="h-8 w-8 shrink-0"
                            >
                              <IconCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              className="h-8 w-8 shrink-0"
                            >
                              <IconX className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-base leading-relaxed wrap-break-word">{item.text}</p>
                            {item.carriedOver && (
                              <Badge
                                variant="outline"
                                className="shrink-0 text-xs border-amber-500 text-amber-700 dark:text-amber-400"
                              >
                                Carried Over
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Emoji Selection - Only in completed mode */}
                        {isCompleted && (
                          <div className="mt-4 space-y-3">
                            <div className="flex gap-2">
                              <Button
                                size="lg"
                                variant={item.emoji === "green" ? "default" : "outline"}
                                onClick={() => handleEmojiClick(index, "green")}
                                className="text-2xl h-14 w-14 p-0 rounded-full"
                              >
                                🟢
                              </Button>
                              <Button
                                size="lg"
                                variant={item.emoji === "yellow" ? "default" : "outline"}
                                onClick={() => handleEmojiClick(index, "yellow")}
                                className="text-2xl h-14 w-14 p-0 rounded-full"
                              >
                                🟡
                              </Button>
                              <Button
                                size="lg"
                                variant={item.emoji === "red" ? "default" : "outline"}
                                onClick={() => handleEmojiClick(index, "red")}
                                className="text-2xl h-14 w-14 p-0 rounded-full"
                              >
                                🔴
                              </Button>
                            </div>

                            {/* Explanation for yellow */}
                            {item.emoji === "yellow" && (
                              <Textarea
                                placeholder="Add explanation (optional)..."
                                value={item.explanation || ""}
                                onChange={(e) =>
                                  handleExplanationChange(index, e.target.value)
                                }
                                onBlur={handleSaveExplanation}
                                className="text-sm min-h-20 resize-none"
                              />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Edit and Remove buttons - Only in draft mode */}
                      {!isCompleted && editingIndex !== index && (
                        <div className="flex gap-1 shrink-0 -mt-1 -mr-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditItem(index)}
                            className="h-9 w-9"
                          >
                            <IconPencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveItem(index)}
                            className="h-9 w-9"
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions - Fixed */}
        <div className="p-4 bg-background border-t space-y-2 shrink-0">
          {/* Mark Completed Button - Only show in draft mode */}
          {!isCompleted && items.length > 0 && (
            <Button onClick={handleMarkCompleted} className="w-full h-12 text-base" size="lg">
              <IconCheck className="mr-2 h-5 w-5" />
              Mark Week Completed
            </Button>
          )}

          {/* Revert to Draft Button - Only show in completed mode */}
          {isCompleted && (
            <Button onClick={handleRevertToDraft} variant="outline" className="w-full h-12 text-base" size="lg">
              <IconX className="mr-2 h-5 w-5" />
              Revert to Draft
            </Button>
          )}

          {/* Copy Button - Show in completed mode or if there are items */}
          {(isCompleted || items.length > 0) && (
            <Button
              onClick={handleCopy}
              variant={copied ? "default" : "outline"}
              className="w-full h-12 text-base"
              size="lg"
            >
              <IconCopy className="mr-2 h-5 w-5" />
              {copied ? "Copied!" : "Copy for WhatsApp"}
            </Button>
          )}

          {/* History Button */}
          <Button
            onClick={() => setShowHistory(true)}
            variant="ghost"
            className="w-full h-12 text-base"
            size="lg"
          >
            <IconHistory className="mr-2 h-5 w-5" />
            View Previous Weeks
          </Button>
        </div>
      </div>
    </div>
  );
}
