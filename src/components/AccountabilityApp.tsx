import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IconPlus, IconTrash, IconCheck, IconCopy, IconHistory, IconPencil, IconX } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { HistoryView } from "./HistoryView";
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

export function AccountabilityApp() {
  const [userId, setUserId] = React.useState<UserId | null>(() => {
    const stored = localStorage.getItem("userId");
    return stored as UserId | null;
  });

  const todaysList = useQuery(api.dailyLists.getTodaysList, userId ? { userId } : "skip");
  const upsertList = useMutation(api.dailyLists.upsertTodaysList);
  const markCompleted = useMutation(api.dailyLists.markTodaysListCompleted);
  const revertToDraft = useMutation(api.dailyLists.revertTodaysListToDraft);
  const updateEmojis = useMutation(api.dailyLists.updateItemsWithEmojis);

  const [items, setItems] = React.useState<ListItem[]>([]);
  const [newItemText, setNewItemText] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [currentSection, setCurrentSection] = React.useState<SectionType>(null);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [editingText, setEditingText] = React.useState("");

  const handleSelectUser = (selectedUserId: UserId) => {
    localStorage.setItem("userId", selectedUserId);
    setUserId(selectedUserId);
  };

  // Load today's list when it's fetched
  React.useEffect(() => {
    if (todaysList?.items) {
      setItems(todaysList.items);
    }
  }, [todaysList]);

  const isCompleted = todaysList?.status === "completed";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
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
      upsertList({ userId, items: newItems, status: "draft" });
    }
  };

  const handleRemoveItem = (index: number) => {
    if (!userId) return;
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    upsertList({ userId, items: newItems, status: todaysList?.status || "draft" });
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
      upsertList({ userId, items: newItems, status: todaysList?.status || "draft" });
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
    await markCompleted({ userId });
  };

  const handleRevertToDraft = async () => {
    if (!userId) return;
    await revertToDraft({ userId });
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
    updateEmojis({ userId, items: newItems });
  };

  const handleExplanationChange = (index: number, explanation: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], explanation };
    setItems(newItems);
  };

  const handleSaveExplanation = () => {
    if (!userId) return;
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
    let formatted = `*${today}*\n\n`;

    // Group items by section
    const personalItems = items.filter(item => item.section === "personal");
    const workItems = items.filter(item => item.section === "work");
    const noSectionItems = items.filter(item => !item.section);

    // Helper function to format items with numbering
    const formatSection = (sectionItems: ListItem[], startNumber: number) => {
      return sectionItems.map((item, idx) => {
        const emoji = getEmojiDisplay(item.emoji);
        const explanation = item.emoji === "yellow" && item.explanation
          ? ` (${item.explanation})`
          : "";
        return `${startNumber + idx}. ${item.text} ${emoji}${explanation}`;
      }).join("\n");
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

  if (showHistory) {
    return <HistoryView userId={userId} onBack={() => setShowHistory(false)} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      {/* User Avatar Badge */}
      <UserAvatar userId={userId} />
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="p-4 bg-background border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold tracking-tight">Daily Accountability</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
            </div>
            {todaysList?.status && (
              <Badge variant={isCompleted ? "default" : "secondary"} className="shrink-0">
                {isCompleted ? "Completed" : "Draft"}
              </Badge>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Add Item Section - Only show in draft mode */}
          {!isCompleted && (
            <div className="space-y-2">
              {/* Section Selector */}
              <Select
                value={currentSection || "none"}
                onValueChange={(value) => setCurrentSection(value === "none" ? null : value as "personal" | "work")}
              >
                <SelectTrigger className="w-fit h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Section</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                </SelectContent>
              </Select>

              {/* Add Item Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a new item..."
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
                No items yet. Add your first item to get started!
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
                            {item.section && (
                              <Badge
                                variant="outline"
                                className={`shrink-0 text-xs ${
                                  item.section === "personal"
                                    ? "border-blue-500 text-blue-700 dark:text-blue-400"
                                    : "border-purple-500 text-purple-700 dark:text-purple-400"
                                }`}
                              >
                                {item.section === "personal" ? "Personal" : "Work"}
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

        {/* Footer Actions */}
        <div className="p-4 bg-background border-t space-y-2">
          {/* Mark Completed Button - Only show in draft mode */}
          {!isCompleted && items.length > 0 && (
            <Button onClick={handleMarkCompleted} className="w-full h-12 text-base" size="lg">
              <IconCheck className="mr-2 h-5 w-5" />
              Mark Day Completed
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
            View Previous Days
          </Button>
        </div>
      </div>
    </div>
  );
}
