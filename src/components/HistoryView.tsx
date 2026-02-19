import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconChevronLeft, IconCopy } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";

interface HistoryViewProps {
  onBack: () => void;
}

export function HistoryView({ onBack }: HistoryViewProps) {
  const allLists = useQuery(api.dailyLists.getAllLists);
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
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let formatted = `*${date}*\n\n`;
    list.items.forEach((item, index) => {
      const emoji = getEmojiDisplay(item.emoji);
      const explanation =
        item.emoji === "yellow" && item.explanation ? ` (${item.explanation})` : "";
      formatted += `${index + 1}. ${item.text} ${emoji}${explanation}\n`;
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
    <div className="flex flex-col min-h-screen bg-muted/30">
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="p-4 bg-background border-b">
          <Button onClick={onBack} variant="ghost" size="sm" className="h-10 -ml-2">
            <IconChevronLeft className="mr-1 h-5 w-5" />
            Back to Today
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Mobile: Show either list or detail. Desktop: Show both side-by-side */}
          <div className="h-full md:grid md:grid-cols-2 md:divide-x">
            {/* List of dates */}
            <div className={`${selectedDate ? "hidden md:block" : "block"} h-full overflow-y-auto`}>
              <div className="p-4">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">Previous Days</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Select a date to view details</p>
                </div>

                {historyLists.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-center text-muted-foreground text-sm">No history yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {historyLists.map((list) => (
                      <button
                        key={list._id}
                        onClick={() => setSelectedDate(list.date)}
                        className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors text-left ${
                          selectedDate === list.date
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted/50 border-border"
                        }`}
                      >
                        <span className="text-base font-medium">{formatDate(list.date)}</span>
                        <Badge
                          variant={list.status === "completed" ? "default" : "secondary"}
                          className={selectedDate === list.date ? "bg-primary-foreground text-primary" : ""}
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
                <div className="p-4 space-y-4">
                  {/* Mobile back button and header */}
                  <div className="md:hidden">
                    <Button
                      onClick={() => setSelectedDate(null)}
                      variant="ghost"
                      size="sm"
                      className="h-10 -ml-2 mb-4"
                    >
                      <IconChevronLeft className="mr-1 h-5 w-5" />
                      Back
                    </Button>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold">{formatDate(selectedList.date)}</h2>
                    </div>
                    <Badge variant={selectedList.status === "completed" ? "default" : "secondary"} className="shrink-0">
                      {selectedList.status === "completed" ? "Completed" : "Draft"}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {selectedList.items.map((item, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <span className="font-semibold text-muted-foreground min-w-6 text-base shrink-0 mt-0.5">
                              {index + 1}.
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-base leading-relaxed wrap-break-word">{item.text}</p>
                              {item.emoji && (
                                <div className="flex items-start gap-2 mt-3">
                                  <span className="text-2xl leading-none">{getEmojiDisplay(item.emoji)}</span>
                                  {item.emoji === "yellow" && item.explanation && (
                                    <span className="text-sm text-muted-foreground wrap-break-word leading-relaxed">
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

                  <Button onClick={handleCopy} variant="outline" size="lg" className="w-full h-12 text-base sticky bottom-0">
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
