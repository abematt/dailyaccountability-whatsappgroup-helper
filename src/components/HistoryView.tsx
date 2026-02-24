import * as React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  IconChevronLeft,
  IconCopy,
  IconPencil,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import type { UserId } from "./UserPicker";

interface HistoryViewProps {
  userId: UserId;
  onBack: () => void;
}

type EmojiType = "green" | "yellow" | "red" | null;

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

export function HistoryView({ userId, onBack }: HistoryViewProps) {
  const allLists = useQuery(api.dailyLists.getAllLists, { userId });
  const markCompleted = useMutation(api.dailyLists.markTodaysListCompleted);
  const revertToDraft = useMutation(api.dailyLists.revertTodaysListToDraft);
  const updateEmojis = useMutation(api.dailyLists.updateItemsWithEmojis);

  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  const [editingItems, setEditingItems] = React.useState<ListItem[]>([]);

  const selectedList = React.useMemo(() => {
    if (!selectedDate || !allLists) return null;
    return allLists.find((list) => list.date === selectedDate);
  }, [selectedDate, allLists]);

  // Load items when entering edit mode or changing selection
  React.useEffect(() => {
    if (selectedList && editMode) {
      setEditingItems(selectedList.items);
    }
  }, [selectedList, editMode]);

  const isCompleted = selectedList?.status === "completed";

  const getEmojiDisplay = (emoji: string | null) => {
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

  const formatForWhatsApp = (list: typeof selectedList) => {
    if (!list) return "";

    const date = new Date(list.date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    const suffix = list.status === "completed" ? "Update" : "Goals";
    const isCompleted = list.status === "completed";
    let formatted = `*${date} - ${suffix}*\n\n`;
    list.items.forEach((item, index) => {
      const emoji = getEmojiDisplay(item.emoji);
      const explanation =
        item.emoji === "yellow" && item.explanation ? ` (${item.explanation})` : "";
      // Use emoji as prefix if completed, otherwise use numbering
      const prefix = isCompleted && emoji ? emoji : `${index + 1}.`;
      formatted += `${prefix} ${item.text}${explanation}\n`;
    });
    return formatted;
  };

  const handleCopy = async () => {
    if (!selectedList) return;
    const formatted = formatForWhatsApp(selectedList);
    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnterEditMode = () => {
    if (selectedList) {
      setEditingItems(selectedList.items);
      setEditMode(true);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditingItems([]);
  };

  const handleEmojiClick = (index: number, emoji: EmojiType) => {
    if (!selectedDate) return;
    const newItems = [...editingItems];
    newItems[index] = { ...newItems[index], emoji };
    if (emoji !== "yellow") {
      delete newItems[index].explanation;
    }
    setEditingItems(newItems);
    // Save live to database
    updateEmojis({ userId, date: selectedDate, items: newItems });
  };

  const handleExplanationChange = (index: number, explanation: string) => {
    if (!selectedDate) return;
    const newItems = [...editingItems];
    newItems[index] = { ...newItems[index], explanation };
    setEditingItems(newItems);
    // Save live to database
    updateEmojis({ userId, date: selectedDate, items: newItems });
  };

  const handleMarkCompleted = async () => {
    if (!selectedDate) return;
    await markCompleted({ userId, date: selectedDate });
    // Stay in edit mode to allow emoji marking
  };

  const handleRevertToDraft = async () => {
    if (!selectedDate) return;
    await revertToDraft({ userId, date: selectedDate });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Filter out today's date from history
  const today = getLocalDateString();
  const historyLists = allLists?.filter((list) => list.date !== today) || [];

  return (
    <div className="app-shell">
      <div className="app-frame">
        {/* Header */}
        <div className="app-header">
          <Button onClick={onBack} variant="ghost" size="sm" className="-ml-2 h-10 rounded-xl px-2">
            <IconChevronLeft className="mr-1 h-5 w-5" />
            Back to Today
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Mobile: Show either list or detail. Desktop: Show both side-by-side */}
          <div className="h-full md:grid md:grid-cols-2 md:divide-x md:divide-border/65">
            {/* List of dates */}
            <div className={`${selectedDate ? "hidden md:block" : "block"} h-full overflow-y-auto`}>
              <div className="p-4 sm:p-5">
                <div className="mb-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">History</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight">Previous Days</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Select a date to view details</p>
                </div>

                {historyLists.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-center text-muted-foreground text-sm">No history yet</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {historyLists.map((list) => (
                      <button
                        key={list._id}
                        onClick={() => setSelectedDate(list.date)}
                        className={`elevated-card w-full text-left flex items-center justify-between rounded-2xl p-4 transition-all ${
                          selectedDate === list.date
                            ? "border-primary/55 bg-primary/10"
                            : "hover:-translate-y-0.5 hover:border-primary/35"
                        }`}
                      >
                        <span className="text-base font-medium">{formatDate(list.date)}</span>
                        <Badge
                          variant={list.status === "completed" ? "default" : "secondary"}
                          className={selectedDate === list.date ? "bg-primary text-primary-foreground" : ""}
                        >
                          {list.items.length}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected date details */}
            <div className={`${selectedDate ? "block" : "hidden md:flex md:items-center md:justify-center"} h-full overflow-y-auto`}>
              {selectedDate && selectedList ? (
                <div className="space-y-4 p-4 sm:p-5">
                  {/* Mobile back button and header */}
                  <div className="md:hidden">
                    <Button
                      onClick={() => setSelectedDate(null)}
                      variant="ghost"
                      size="sm"
                      className="-ml-2 mb-4 h-10 rounded-xl px-2"
                    >
                      <IconChevronLeft className="mr-1 h-5 w-5" />
                      Back
                    </Button>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold tracking-tight">{formatDate(selectedList.date)}</h2>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={selectedList.status === "completed" ? "default" : "secondary"} className="h-6 px-2.5 text-[11px] font-semibold uppercase tracking-wide">
                        {selectedList.status === "completed" ? "Completed" : "In Progress"}
                      </Badge>
                      <Button
                        size="sm"
                        variant={editMode ? "secondary" : "outline"}
                        onClick={() => editMode ? handleCancelEdit() : handleEnterEditMode()}
                        className={`h-7 rounded-lg px-2.5 text-xs ${
                          editMode
                            ? "border-amber-300/70 bg-amber-100/70 text-amber-900 hover:bg-amber-200/70 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200"
                            : ""
                        }`}
                      >
                        {editMode ? (
                          <>
                            <IconX className="mr-1.5 h-3.5 w-3.5" />
                            View
                          </>
                        ) : (
                          <>
                            <IconPencil className="mr-1.5 h-3.5 w-3.5" />
                            Edit
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {!editMode ? (
                    <>
                      {/* View Mode */}
                      <div className="space-y-3.5">
                        {selectedList.items.map((item, index) => (
                          <Card key={index} className="task-card">
                            <CardContent className="px-3 py-2.5 sm:px-3.5 sm:py-2.5">
                              <div className="task-row">
                                <div className="flex-1 min-w-0">
                                  <p className="task-text">{item.text}</p>
                                  {item.section && (
                                    <Badge
                                      variant="secondary"
                                      className={`mt-2 h-6 px-2.5 text-[10px] font-semibold uppercase ${
                                        item.section === "personal"
                                          ? "border-blue-300 bg-blue-50/80 text-blue-700"
                                          : "border-violet-300 bg-violet-50/80 text-violet-700"
                                      }`}
                                    >
                                      {item.section}
                                    </Badge>
                                  )}
                                  {item.emoji && (
                                    <div className="flex items-start gap-2 mt-3">
                                      <span className="text-2xl leading-none">{getEmojiDisplay(item.emoji)}</span>
                                      {item.emoji === "yellow" && item.explanation && (
                                        <span className="text-sm leading-relaxed text-muted-foreground wrap-break-word">
                                          {item.explanation}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <div className="space-y-2.5">
                        <Button onClick={handleCopy} variant="outline" size="lg" className="h-12 w-full rounded-2xl text-base">
                          <IconCopy className="mr-2 h-5 w-5" />
                          {copied ? "Copied!" : "Copy for WhatsApp"}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Edit Mode */}
                      <div className="space-y-3">
                        {editingItems.map((item, index) => (
                          <Card
                            key={index}
                            className={`task-card rounded-md transition-colors ${
                              isCompleted
                                ? item.emoji
                                  ? "border-foreground/35 bg-foreground/[0.11]"
                                  : "border-border/70 bg-background"
                                : ""
                            }`}
                          >
                            <CardContent className="px-3.5 py-3 sm:px-4 sm:py-3.5">
                              <div className="task-row">
                                <div className="flex-1 min-w-0">
                                  <p className="task-text">{item.text}</p>
                                  {item.section && (
                                    <Badge
                                      variant="secondary"
                                      className={`mt-2 h-6 px-2.5 text-[10px] font-semibold uppercase ${
                                        item.section === "personal"
                                          ? "border-blue-300 bg-blue-50/80 text-blue-700"
                                          : "border-violet-300 bg-violet-50/80 text-violet-700"
                                      }`}
                                    >
                                      {item.section}
                                    </Badge>
                                  )}

                                  {isCompleted && (
                                    <div className="mt-4">
                                      <div className="flex items-center gap-2.5">
                                        <Button
                                          onClick={() => handleEmojiClick(index, "green")}
                                          variant={item.emoji === "green" ? "default" : "outline"}
                                          className={`h-12 flex-1 rounded-2xl text-2xl ${item.emoji === "green" ? "border-green-400 bg-green-500/90 hover:bg-green-600" : "border-border/75"}`}
                                        >
                                          🟢
                                        </Button>
                                        <Button
                                          onClick={() => handleEmojiClick(index, "yellow")}
                                          variant={item.emoji === "yellow" ? "default" : "outline"}
                                          className={`h-12 flex-1 rounded-2xl text-2xl ${item.emoji === "yellow" ? "border-yellow-400 bg-yellow-500/90 hover:bg-yellow-600" : "border-border/75"}`}
                                        >
                                          🟡
                                        </Button>
                                        <Button
                                          onClick={() => handleEmojiClick(index, "red")}
                                          variant={item.emoji === "red" ? "default" : "outline"}
                                          className={`h-12 flex-1 rounded-2xl text-2xl ${item.emoji === "red" ? "border-red-400 bg-red-500/90 hover:bg-red-600" : "border-border/75"}`}
                                        >
                                          🔴
                                        </Button>
                                      </div>

                                      {item.emoji === "yellow" && (
                                        <Textarea
                                          placeholder="Add explanation (optional)..."
                                          value={item.explanation || ""}
                                          onChange={(e) => handleExplanationChange(index, e.target.value)}
                                          className="mt-3 min-h-20 rounded-2xl border-border/75 bg-background/70 text-sm resize-none"
                                        />
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <div className="space-y-2.5">
                        {!isCompleted && editingItems.length > 0 && (
                          <Button
                            onClick={handleMarkCompleted}
                            className="h-12 w-full rounded-2xl text-base shadow-sm"
                            size="lg"
                          >
                            <IconCheck className="mr-2 h-5 w-5" />
                            Mark Day Completed
                          </Button>
                        )}

                        {isCompleted && (
                          <Button
                            onClick={handleRevertToDraft}
                            variant="secondary"
                            className="h-12 w-full rounded-2xl border border-amber-300/70 bg-amber-100/70 text-amber-900 hover:bg-amber-200/70 text-base"
                            size="lg"
                          >
                            <IconX className="mr-2 h-5 w-5" />
                            Back to Goals
                          </Button>
                        )}

                        <Button onClick={handleCopy} variant="outline" size="lg" className="h-12 w-full rounded-2xl text-base">
                          <IconCopy className="mr-2 h-5 w-5" />
                          {copied ? "Copied!" : "Copy for WhatsApp"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground text-sm">
                    Select a date from the list to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
