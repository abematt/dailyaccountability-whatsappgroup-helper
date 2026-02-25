import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IconPlus, IconTrash, IconCheck, IconCopy, IconHistory, IconPencil, IconX, IconArrowLeft, IconRefresh } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { WeeklyHistoryView } from "./WeeklyHistoryView";
import { UserAvatar } from "./UserAvatar";
import type { UserId } from "./UserPicker";
import { motion, AnimatePresence } from "framer-motion";
import { TaskSkeleton } from "@/components/ui/skeleton";

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
  const [editModeIndex, setEditModeIndex] = React.useState<number | null>(null);
  const hasNewItemText = newItemText.trim().length > 0;

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
  const isLoading = weeklyGoals === undefined;

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
  const formatWeekRange = () => {
    if (!weeklyGoals) return "";
    return formatWeekDisplay().replace(`Week ${weeklyGoals.weekNumber} - `, "");
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

  const handleToggleEditMode = (index: number) => {
    setEditModeIndex(editModeIndex === index ? null : index);
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
    setEditModeIndex(null);
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
  const getItemAccentClass = (emoji: EmojiType) =>
    emoji
      ? "border-foreground/35 bg-foreground/[0.11] dark:border-foreground/40 dark:bg-foreground/[0.16]"
      : "border-border/70 bg-background";

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
    <div className="app-shell">
      <div className="app-frame">
        {/* Header - Fixed */}
        <div className="app-header shrink-0">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={onBack}
              className="h-9 w-9 shrink-0 rounded-xl border border-border/70 bg-background/60"
            >
              <IconArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-extrabold tracking-wide uppercase text-foreground/80 whitespace-nowrap" style={{ fontFamily: 'Inter, -apple-system, system-ui, sans-serif', fontWeight: '800' }}>
              {weeklyGoals ? `Week ${weeklyGoals.weekNumber}` : "Week"}
            </h1>
            <div className="ml-auto flex items-center gap-2 shrink-0">
              <UserAvatar userId={userId} inline />
            </div>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground">
              {weeklyGoals ? `Week ${weeklyGoals.weekNumber}` : ""}
            </span>
            <span className="text-muted-foreground">
              {weeklyGoals ? formatWeekRange() : ""}
            </span>
          </div>
        </div>

        {/* Content Area - Scrollable */}
        <div className="app-content">
          <div className="space-y-4">
            {/* Add Item Section - Only show in draft mode */}
            {!isCompleted && (
              <div className="px-0 py-1 sm:px-3.5 sm:py-2.5">
                <div className="flex items-center gap-2.5">
                  <Input
                    placeholder="Type your goal here..."
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && hasNewItemText && handleAddItem()
                    }
                    className="h-11 flex-1 rounded-lg border-border/75 bg-background/75 text-base"
                  />
                  <Button
                    onClick={handleAddItem}
                    disabled={!hasNewItemText}
                    size="icon"
                    className="h-11 w-11 shrink-0 rounded-2xl shadow-sm"
                  >
                    <IconPlus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {!isCompleted && (
              <div className="px-0 sm:px-3.5">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border/60"></div>
                  <h2 className="text-xl font-extrabold tracking-wide uppercase text-muted-foreground/70 shrink-0 whitespace-nowrap" style={{ fontFamily: 'Inter, -apple-system, system-ui, sans-serif', fontWeight: '800' }}>Task List</h2>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border/60"></div>
                </div>
              </div>
            )}

            {/* Items List */}
            {weeklyGoals === undefined ? (
              <TaskSkeleton />
            ) : items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="elevated-card">
                  <CardContent className="flex items-center justify-center py-10 sm:py-14">
                    <p className="text-center text-muted-foreground text-sm">
                      No goals yet. Add your first goal to get started!
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -100, scale: 0.95 }}
                    transition={{
                      duration: 0.2,
                      delay: index * 0.03
                    }}
                    layout
                  >
                    <Card
                      key={index}
                      className={`task-card rounded-md transition-colors ${isCompleted ? getItemAccentClass(item.emoji) : ""}`}
                    >
                  <CardContent className="px-3 py-2.5 sm:px-3.5 sm:py-3">
                    {editingIndex === index ? (
                      <div className="flex items-center gap-2.5">
                        <Input
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(index);
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                          autoFocus
                          className="h-10 flex-1 rounded-xl border-border/75 bg-background/75 text-base"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleSaveEdit(index)}
                          className="h-9 w-9 shrink-0 rounded-xl"
                        >
                          <IconCheck className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          className="h-9 w-9 shrink-0 rounded-xl"
                        >
                          <IconX className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Text and badges row */}
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="task-text">{item.text}</p>
                          </div>

                          {/* Always visible action - Only in draft mode */}
                          {!isCompleted && (
                            <div className="flex shrink-0 items-center gap-2">
                              {/* Carried Over badge */}
                              {item.carriedOver && (
                                <Badge
                                  variant="outline"
                                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center border-amber-300 bg-amber-50/90 p-0 text-amber-700"
                                  title="Carried over from previous week"
                                >
                                  <IconRefresh className="h-3 w-3" />
                                </Badge>
                              )}

                              {/* Edit mode toggle */}
                              <Button
                                size="icon"
                                variant={editModeIndex === index ? "secondary" : "ghost"}
                                onClick={() => handleToggleEditMode(index)}
                                className="h-8 w-8 rounded-xl"
                                title="Edit options"
                              >
                                <IconPencil className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Edit mode panel - Only show when editModeIndex matches */}
                        <AnimatePresence>
                          {!isCompleted && editModeIndex === index && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                            {/* Edit and delete actions */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditItem(index)}
                              className="h-7 rounded-full px-3"
                            >
                              <IconPencil className="mr-1 h-3 w-3" />
                              <span className="text-[10px] font-medium">Edit</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveItem(index)}
                              className="h-7 rounded-full px-3 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                            >
                              <IconTrash className="mr-1 h-3 w-3" />
                                <span className="text-[10px] font-medium">Delete</span>
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                        {/* Emoji Selection - Only in completed mode */}
                        <AnimatePresence>
                          {isCompleted && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                              className="mt-1 space-y-3 overflow-hidden"
                            >
                            <div className="flex gap-2.5">
                              <Button
                                size="lg"
                                variant={item.emoji === "green" ? "default" : "outline"}
                                onClick={() => handleEmojiClick(index, "green")}
                                className="h-12 w-12 rounded-2xl p-0 text-2xl sm:h-14 sm:w-14"
                              >
                                🟢
                              </Button>
                              <Button
                                size="lg"
                                variant={item.emoji === "yellow" ? "default" : "outline"}
                                onClick={() => handleEmojiClick(index, "yellow")}
                                className="h-12 w-12 rounded-2xl p-0 text-2xl sm:h-14 sm:w-14"
                              >
                                🟡
                              </Button>
                              <Button
                                size="lg"
                                variant={item.emoji === "red" ? "default" : "outline"}
                                onClick={() => handleEmojiClick(index, "red")}
                                className="h-12 w-12 rounded-2xl p-0 text-2xl sm:h-14 sm:w-14"
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
                                className="min-h-20 rounded-2xl border-border/75 bg-background/70 text-sm resize-none"
                              />
                            )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions - Fixed */}
        <div className="app-footer space-y-2 shrink-0">
          {/* Mark Completed and Copy buttons row */}
          {(!isCompleted && items.length > 0) || (isCompleted || items.length > 0) || isLoading ? (
            <div className="flex gap-2">
              {/* Mark Completed Button - Only show in draft mode */}
              {!isCompleted && (
                <Button
                  onClick={handleMarkCompleted}
                  disabled={isLoading || items.length === 0}
                  className="h-10 flex-1 rounded-xl text-sm shadow-sm"
                >
                  <IconCheck className="mr-1.5 h-4 w-4" />
                  Mark Complete
                </Button>
              )}

              {/* Revert to Draft Button - Only show in completed mode */}
              {isCompleted && (
                <Button
                  onClick={handleRevertToDraft}
                  disabled={isLoading}
                  variant="secondary"
                  className="h-10 flex-1 rounded-xl border border-amber-300/70 bg-amber-100/70 text-amber-900 hover:bg-amber-200/70 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200 dark:hover:bg-amber-500/20 text-sm"
                >
                  <IconX className="mr-1.5 h-4 w-4" />
                  Back to Goals
                </Button>
              )}

              {/* Copy Button - Show in completed mode or if there are items */}
              {(isCompleted || items.length > 0 || isLoading) && (
                <Button
                  onClick={handleCopy}
                  disabled={isLoading || items.length === 0}
                  variant={copied ? "default" : "outline"}
                  className="h-10 flex-1 rounded-xl text-sm"
                >
                  <IconCopy className="mr-1.5 h-4 w-4" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
              )}
            </div>
          ) : null}

          {/* History Button - Full width below */}
          <Button
            onClick={() => setShowHistory(true)}
            disabled={isLoading}
            variant="ghost"
            className="h-10 w-full rounded-xl text-sm"
          >
            <IconHistory className="mr-1.5 h-4 w-4" />
            View Previous Weeks
          </Button>
        </div>
      </div>
    </div>
  );
}
