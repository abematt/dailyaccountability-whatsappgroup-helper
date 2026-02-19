import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconChevronLeft, IconCopy } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import type { UserId } from "./UserPicker";

interface HistoryViewProps {
  userId: UserId;
  onBack: () => void;
}

export function HistoryView({ userId, onBack }: HistoryViewProps) {
  const allLists = useQuery(api.dailyLists.getAllLists, { userId });
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const selectedList = React.useMemo(() => {
    if (!selectedDate || !allLists) return null;
    return allLists.find((list) => list.date === selectedDate);
  }, [selectedDate, allLists]);

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
  const today = new Date().toISOString().split("T")[0];
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
                    <Badge variant={selectedList.status === "completed" ? "default" : "secondary"} className="h-6 shrink-0 px-2.5 text-[11px] font-semibold uppercase tracking-wide">
                      {selectedList.status === "completed" ? "Completed" : "In Progress"}
                    </Badge>
                  </div>

                  <div className="space-y-3.5">
                    {selectedList.items.map((item, index) => (
                      <Card key={index} className="task-card">
                        <CardContent className="px-3 py-2.5 sm:px-3.5 sm:py-2.5">
                          <div className="task-row">
                            <div className="flex-1 min-w-0">
                              <p className="task-text">{item.text}</p>
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

                  <Button onClick={handleCopy} variant="outline" size="lg" className="sticky bottom-0 h-12 w-full rounded-2xl border-border/80 bg-background/85 text-base backdrop-blur">
                    <IconCopy className="mr-2 h-5 w-5" />
                    {copied ? "Copied!" : "Copy for WhatsApp"}
                  </Button>
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
