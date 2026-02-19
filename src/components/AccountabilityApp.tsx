import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IconPlus, IconTrash, IconCheck, IconCopy, IconHistory } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { HistoryView } from "./HistoryView";

type EmojiType = "green" | "yellow" | "red" | null;

interface ListItem {
  text: string;
  emoji: EmojiType;
  explanation?: string;
}

export function AccountabilityApp() {
  const todaysList = useQuery(api.dailyLists.getTodaysList);
  const upsertList = useMutation(api.dailyLists.upsertTodaysList);
  const markCompleted = useMutation(api.dailyLists.markTodaysListCompleted);
  const updateEmojis = useMutation(api.dailyLists.updateItemsWithEmojis);

  const [items, setItems] = React.useState<ListItem[]>([]);
  const [newItemText, setNewItemText] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);

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
    if (newItemText.trim()) {
      const newItems = [...items, { text: newItemText.trim(), emoji: null }];
      setItems(newItems);
      setNewItemText("");
      upsertList({ items: newItems, status: "draft" });
    }
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    upsertList({ items: newItems, status: todaysList?.status || "draft" });
  };

  const handleMarkCompleted = async () => {
    await markCompleted();
  };

  const handleEmojiClick = (index: number, emoji: EmojiType) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], emoji };

    // Clear explanation if not yellow
    if (emoji !== "yellow") {
      delete newItems[index].explanation;
    }

    setItems(newItems);
    updateEmojis({ items: newItems });
  };

  const handleExplanationChange = (index: number, explanation: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], explanation };
    setItems(newItems);
  };

  const handleSaveExplanation = () => {
    updateEmojis({ items });
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
    items.forEach((item, index) => {
      const emoji = getEmojiDisplay(item.emoji);
      const explanation = item.emoji === "yellow" && item.explanation ? ` (${item.explanation})` : "";
      formatted += `${index + 1}. ${item.text} ${emoji}${explanation}\n`;
    });
    return formatted;
  };

  const handleCopy = async () => {
    const formatted = formatForWhatsApp();
    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (showHistory) {
    return <HistoryView onBack={() => setShowHistory(false)} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
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
          )}

          {/* Items List */}
          {items.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-center text-muted-foreground text-sm">
                No items yet. Add your first item to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="font-semibold text-muted-foreground min-w-6 text-base shrink-0 mt-0.5">
                        {index + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-base leading-relaxed wrap-break-word">{item.text}</p>

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

                      {/* Remove button - Only in draft mode */}
                      {!isCompleted && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveItem(index)}
                          className="shrink-0 h-9 w-9 -mt-1 -mr-1"
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
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
