import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  IconPlus,
  IconTrash,
  IconCheck,
  IconCopy,
  IconHistory,
  IconPencil,
  IconX,
  IconCalendarWeek,
  IconChevronDown,
  IconBriefcase,
  IconUser,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { HistoryView } from "./HistoryView";
import { WeeklyGoalsApp } from "./WeeklyGoalsApp";
import { UserPicker, type UserId } from "./UserPicker";
import { UserAvatar } from "./UserAvatar";

type EmojiType = "green" | "yellow" | "red" | null;
type SectionType = "personal" | "work" | null;

interface ListItem {
  text: string;
  emoji: EmojiType;
  explanation?: string;
  section?: "personal" | "work";
}

function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AccountabilityApp() {
  const [userId, setUserId] = React.useState<UserId | null>(() => {
    const stored = localStorage.getItem("userId");
    return stored as UserId | null;
  });
  const todayLocalDate = React.useMemo(() => getLocalDateString(), []);
  const isInitializingTodayRef = React.useRef(false);

  const todaysList = useQuery(
    api.dailyLists.getTodaysList,
    userId ? { userId, date: todayLocalDate } : "skip",
  );
  const daysSinceWeeklyUpdate = useQuery(
    api.weeklyGoals.getDaysSinceLastUpdate,
    userId ? { userId } : "skip",
  );
  const initializeTodaysList = useMutation(api.dailyLists.initializeTodaysList);
  const upsertList = useMutation(api.dailyLists.upsertTodaysList);
  const markCompleted = useMutation(api.dailyLists.markTodaysListCompleted);
  const revertToDraft = useMutation(api.dailyLists.revertTodaysListToDraft);
  const updateEmojis = useMutation(api.dailyLists.updateItemsWithEmojis);

  const [items, setItems] = React.useState<ListItem[]>([]);
  const [newItemText, setNewItemText] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [showWeekly, setShowWeekly] = React.useState(false);
  const [currentSection, setCurrentSection] = React.useState<SectionType>(null);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [editingText, setEditingText] = React.useState("");
  const hasNewItemText = newItemText.trim().length > 0;

  const handleSelectUser = (selectedUserId: UserId) => {
    localStorage.setItem("userId", selectedUserId);
    setUserId(selectedUserId);
  };

  // Load today's list when it's fetched
  React.useEffect(() => {
    if (todaysList?.items) {
      setItems(todaysList.items);
      return;
    }
    if (todaysList === null) {
      setItems([]);
    }
  }, [todaysList]);

  React.useEffect(() => {
    if (!userId || todaysList !== null || isInitializingTodayRef.current) return;
    isInitializingTodayRef.current = true;
    initializeTodaysList({ userId, date: todayLocalDate }).finally(() => {
      isInitializingTodayRef.current = false;
    });
  }, [initializeTodaysList, todayLocalDate, todaysList, userId]);

  const isCompleted = todaysList?.status === "completed";
  const todayDate = new Date();
  const todayWeekday = todayDate.toLocaleDateString("en-US", {
    weekday: "long",
  });
  const todayDayMonthYear = todayDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const handleAddItem = () => {
    if (newItemText.trim() && userId) {
      const newItem: ListItem = {
        text: newItemText.trim(),
        emoji: null,
      };

      if (currentSection) {
        newItem.section = currentSection;
      }

      const newItems = [...items, newItem];
      setItems(newItems);
      setNewItemText("");
      upsertList({ userId, date: todayLocalDate, items: newItems, status: "draft" });
    }
  };

  const handleRemoveItem = (index: number) => {
    if (!userId) return;
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    upsertList({
      userId,
      date: todayLocalDate,
      items: newItems,
      status: todaysList?.status || "draft",
    });
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
      upsertList({
        userId,
        date: todayLocalDate,
        items: newItems,
        status: todaysList?.status || "draft",
      });
    }
    setEditingIndex(null);
    setEditingText("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingText("");
  };

  const handleMarkCompleted = async () => {
    if (!userId) return;
    await markCompleted({ userId, date: todayLocalDate });
  };

  const handleRevertToDraft = async () => {
    if (!userId) return;
    await revertToDraft({ userId, date: todayLocalDate });
  };

  const handleEmojiClick = (index: number, emoji: EmojiType) => {
    if (!userId) return;
    const newItems = [...items];
    newItems[index] = { ...newItems[index], emoji };

    // Clear explanation if not yellow
    if (emoji !== "yellow") {
      delete newItems[index].explanation;
    }

    setItems(newItems);
    updateEmojis({ userId, date: todayLocalDate, items: newItems });
  };

  const handleExplanationChange = (index: number, explanation: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], explanation };
    setItems(newItems);
  };

  const handleSaveExplanation = () => {
    if (!userId) return;
    updateEmojis({ userId, date: todayLocalDate, items });
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
    const suffix = isCompleted ? "Update" : "Goals";
    const todayFormatted = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    let formatted = `*${todayFormatted} - ${suffix}*\n\n`;

    // Group items by section
    const personalItems = items.filter((item) => item.section === "personal");
    const workItems = items.filter((item) => item.section === "work");
    const noSectionItems = items.filter((item) => !item.section);

    // Helper function to format items with numbering or emoji prefix
    const formatSection = (sectionItems: ListItem[], startNumber: number) => {
      return sectionItems
        .map((item, idx) => {
          const emoji = getEmojiDisplay(item.emoji);
          const explanation =
            item.emoji === "yellow" && item.explanation
              ? ` (${item.explanation})`
              : "";
          // Use emoji as prefix if completed, otherwise use numbering
          const prefix = isCompleted && emoji ? emoji : `${startNumber + idx}.`;
          return `${prefix} ${item.text}${explanation}`;
        })
        .join("\n");
    };

    let currentNumber = 1;

    // Add no-section items first
    if (noSectionItems.length > 0) {
      formatted += formatSection(noSectionItems, currentNumber);
      formatted += "\n\n";
      currentNumber += noSectionItems.length;
    }

    // Add Personal section
    if (personalItems.length > 0) {
      formatted += "*Personal*\n";
      formatted += formatSection(personalItems, currentNumber);
      formatted += "\n\n";
      currentNumber += personalItems.length;
    }

    // Add Work section
    if (workItems.length > 0) {
      formatted += "*Work*\n";
      formatted += formatSection(workItems, currentNumber);
      formatted += "\n";
    }

    return formatted.trim();
  };

  const handleCopy = async () => {
    const formatted = formatForWhatsApp();
    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Show user picker if no user is selected
  if (!userId) {
    return <UserPicker onSelectUser={handleSelectUser} />;
  }

  if (showWeekly) {
    return (
      <WeeklyGoalsApp userId={userId} onBack={() => setShowWeekly(false)} />
    );
  }

  if (showHistory) {
    return <HistoryView userId={userId} onBack={() => setShowHistory(false)} />;
  }

  const showWeeklyReminder =
    daysSinceWeeklyUpdate !== undefined && daysSinceWeeklyUpdate >= 7;
  const sectionIcon =
    currentSection === "work" ? (
      <IconBriefcase className="h-5 w-5" />
    ) : currentSection === "personal" ? (
      <IconUser className="h-5 w-5" />
    ) : (
      <IconChevronDown className="h-5 w-5" />
    );
  const actionButtons = (
    <>
      {/* Mark Completed Button - Only show in draft mode */}
      {!isCompleted && items.length > 0 && (
        <Button
          onClick={handleMarkCompleted}
          className="h-12 w-full rounded-2xl text-base shadow-sm"
          size="lg"
        >
          <IconCheck className="mr-2 h-5 w-5" />
          Mark Day Completed
        </Button>
      )}

      {/* Revert to Draft Button - Only show in completed mode */}
      {isCompleted && (
        <Button
          onClick={handleRevertToDraft}
          variant="secondary"
          className="h-12 w-full rounded-2xl border border-amber-300/70 bg-amber-100/70 text-amber-900 hover:bg-amber-200/70 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200 dark:hover:bg-amber-500/20 text-base"
          size="lg"
        >
          <IconX className="mr-2 h-5 w-5" />
          Back to Goals
        </Button>
      )}

      {/* Copy Button - Show in completed mode or if there are items */}
      {(isCompleted || items.length > 0) && (
        <Button
          onClick={handleCopy}
          variant={copied ? "default" : "outline"}
          className="h-12 w-full rounded-2xl text-base"
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
        className="h-12 w-full rounded-2xl text-base"
        size="lg"
      >
        <IconHistory className="mr-2 h-5 w-5" />
        View Previous Days
      </Button>
    </>
  );

  return (
    <div className="app-shell">
      <div className="app-frame">
        {/* Header - Fixed */}
        <div className="app-header shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-[1.28rem] font-semibold tracking-tight text-balance">
              Today's Goals
            </h1>
            <div className="flex items-center gap-2 shrink-0">
              {todaysList?.status && (
                <Badge
                  variant={isCompleted ? "default" : "secondary"}
                  className="h-6 px-2.5 text-[11px] font-semibold uppercase tracking-wide"
                >
                  {isCompleted ? "Completed" : "In Progress"}
                </Badge>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowWeekly(true)}
                className="h-10 w-10 rounded-2xl border border-border/70 bg-background/60"
                title="Weekly Goals"
              >
                <IconCalendarWeek className="h-5 w-5" />
              </Button>
              <UserAvatar userId={userId} inline />
            </div>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{todayWeekday}</span>{" "}
            {todayDayMonthYear}
          </p>
        </div>

        {/* Content Area - Scrollable */}
        <div className="app-content">
          <div className="grid h-full gap-5 lg:grid-cols-[minmax(0,1fr)_19.5rem]">
            <div className="min-w-0 space-y-4">
              {/* 7-Day Reminder Banner */}
              {showWeeklyReminder && (
                <Card className="elevated-card border-amber-300/80 bg-gradient-to-r from-amber-50/95 via-amber-50/85 to-orange-50/90">
                  <CardContent className="p-3.5 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-amber-900">
                          You haven't updated your weekly progress in{" "}
                          {daysSinceWeeklyUpdate} days
                        </p>
                        <p className="mt-1 text-xs text-amber-700">
                          Keep your momentum going by reviewing your weekly
                          goals
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setShowWeekly(true)}
                        className="h-9 shrink-0 rounded-xl bg-amber-600 px-3 text-white hover:bg-amber-700"
                      >
                        Update Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

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
                    <Select
                      value={currentSection || "none"}
                      onValueChange={(value) =>
                        setCurrentSection(
                          value === "none"
                            ? null
                            : (value as "personal" | "work"),
                        )
                      }
                    >
                      <SelectTrigger
                        className="!h-11 !w-11 !min-w-11 !max-w-11 rounded-2xl border-border/75 bg-background/75 !px-0 !justify-center [&>[data-slot=select-value]]:hidden [&>svg:last-child]:hidden"
                        aria-label="Choose section"
                        title={
                          currentSection === "personal"
                            ? "Personal section"
                            : currentSection === "work"
                              ? "Work section"
                              : "No section"
                        }
                      >
                        <span className="pointer-events-none text-muted-foreground">
                          {sectionIcon}
                        </span>
                        <span className="sr-only">Choose section</span>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent
                        position="popper"
                        align="end"
                        sideOffset={6}
                        className="min-w-36 p-1.5"
                      >
                        <SelectItem
                          value="none"
                          className="rounded-lg py-2.5 pl-3.5 pr-8"
                        >
                          No Section
                        </SelectItem>
                        <SelectItem
                          value="personal"
                          className="rounded-lg py-2.5 pl-3.5 pr-8"
                        >
                          Personal
                        </SelectItem>
                        <SelectItem
                          value="work"
                          className="rounded-lg py-2.5 pl-3.5 pr-8"
                        >
                          Work
                        </SelectItem>
                      </SelectContent>
                    </Select>
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

              <div className="px-0 sm:px-3.5">
                <h2 className="text-sm font-semibold tracking-tight">Task List</h2>
              </div>

              {/* Items List */}
              {items.length === 0 ? (
                <Card className="elevated-card">
                  <CardContent className="flex items-center justify-center py-10 sm:py-14">
                    <p className="text-center text-muted-foreground text-sm">
                      No items yet. Add your first item to get started!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <Card
                      key={index}
                      className={`task-card rounded-md transition-colors ${isCompleted ? getItemAccentClass(item.emoji) : ""}`}
                    >
                      <CardContent className="px-3.5 py-3 sm:px-4 sm:py-3.5">
                        <div className="task-row">
                          <div className="flex-1 min-w-0">
                            {editingIndex === index ? (
                              <div className="task-row">
                                <Input
                                  value={editingText}
                                  onChange={(e) =>
                                    setEditingText(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      handleSaveEdit(index);
                                    if (e.key === "Escape")
                                      handleCancelEdit();
                                  }}
                                  autoFocus
                                  className="h-10 rounded-xl border-border/75 bg-background/75 text-base"
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
                              <div className="task-row">
                                <p className="task-text">{item.text}</p>
                                {item.section && (
                                  <Badge
                                    variant="outline"
                                    className={`h-5 shrink-0 text-[10px] font-semibold uppercase tracking-wide ${
                                      item.section === "personal"
                                        ? "border-blue-300 bg-blue-50/80 text-blue-700"
                                        : "border-violet-300 bg-violet-50/80 text-violet-700"
                                    }`}
                                  >
                                    {item.section === "personal"
                                      ? "Personal"
                                      : "Work"}
                                  </Badge>
                                )}
                              </div>
                            )}

                            {/* Emoji Selection - Only in completed mode */}
                            {isCompleted && (
                              <div className="mt-3 space-y-3">
                                <div className="flex gap-2.5">
                                  <Button
                                    size="lg"
                                    variant={
                                      item.emoji === "green"
                                        ? "default"
                                        : "outline"
                                    }
                                    onClick={() =>
                                      handleEmojiClick(index, "green")
                                    }
                                    className="h-12 w-12 rounded-2xl p-0 text-2xl sm:h-14 sm:w-14"
                                  >
                                    🟢
                                  </Button>
                                  <Button
                                    size="lg"
                                    variant={
                                      item.emoji === "yellow"
                                        ? "default"
                                        : "outline"
                                    }
                                    onClick={() =>
                                      handleEmojiClick(index, "yellow")
                                    }
                                    className="h-12 w-12 rounded-2xl p-0 text-2xl sm:h-14 sm:w-14"
                                  >
                                    🟡
                                  </Button>
                                  <Button
                                    size="lg"
                                    variant={
                                      item.emoji === "red"
                                        ? "default"
                                        : "outline"
                                    }
                                    onClick={() =>
                                      handleEmojiClick(index, "red")
                                    }
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
                                      handleExplanationChange(
                                        index,
                                        e.target.value,
                                      )
                                    }
                                    onBlur={handleSaveExplanation}
                                    className="min-h-20 rounded-2xl border-border/75 bg-background/70 text-sm resize-none"
                                  />
                                )}
                              </div>
                            )}
                          </div>

                          {/* Edit and Remove buttons - Only in draft mode */}
                          {!isCompleted && editingIndex !== index && (
                            <div className="flex shrink-0 items-center gap-2.5">
                              <Separator
                                orientation="vertical"
                                className="hidden h-5 md:block"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEditItem(index)}
                                className="h-8 w-8 rounded-xl"
                              >
                                <IconPencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleRemoveItem(index)}
                                className="h-8 w-8 rounded-xl"
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

            <div className="hidden lg:block">
              <Card className="elevated-card sticky top-0">
                <CardContent className="space-y-4 p-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Actions
                    </p>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Manage today and export your update.
                    </p>
                  </div>
                  <div className="space-y-2.5">{actionButtons}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer Actions - Fixed */}
        <div className="app-footer space-y-2.5 shrink-0 lg:hidden">
          {actionButtons}
        </div>
      </div>
    </div>
  );
}
