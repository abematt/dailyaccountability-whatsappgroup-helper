import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconChevronLeft, IconCopy } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import type { UserId } from "./UserPicker";

interface WeeklyHistoryViewProps {
  userId: UserId;
  onBack: () => void;
}

export function WeeklyHistoryView({ userId, onBack }: WeeklyHistoryViewProps) {
  const allWeeks = useQuery(api.weeklyGoals.getAllWeeklyGoals, { userId });
  const [selectedWeekStart, setSelectedWeekStart] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const selectedWeek = React.useMemo(() => {
    if (!selectedWeekStart || !allWeeks) return null;
    return allWeeks.find((week) => week.weekStart === selectedWeekStart);
  }, [selectedWeekStart, allWeeks]);

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

  const formatWeekDisplay = (week: typeof selectedWeek) => {
    if (!week) return "";

    const startDate = new Date(week.weekStart + "T00:00:00");
    const endDate = new Date(week.weekEnd + "T00:00:00");

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const startDay = startDate.getDate();
    const startMonth = monthNames[startDate.getMonth()];

    const endDay = endDate.getDate();
    const endMonth = monthNames[endDate.getMonth()];

    return `Week ${week.weekNumber} - ${startDay} ${startMonth} - ${endDay} ${endMonth}`;
  };

  const formatForWhatsApp = (week: typeof selectedWeek) => {
    if (!week) return "";

    const suffix = week.status === "completed" ? "Update" : "Goals";
    const isCompleted = week.status === "completed";
    let formatted = `*${formatWeekDisplay(week)} - ${suffix}*\n\n`;
    week.items.forEach((item, index) => {
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
    if (!selectedWeek) return;
    const formatted = formatForWhatsApp(selectedWeek);
    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter out current week from history
  const getCurrentWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    return monday.toISOString().split("T")[0];
  };

  const currentWeekStart = getCurrentWeekStart();
  const historyWeeks = allWeeks?.filter((week) => week.weekStart !== currentWeekStart) || [];

  return (
    <div className="app-shell">
      <div className="app-frame">
        {/* Header */}
        <div className="app-header">
          <Button onClick={onBack} variant="ghost" size="sm" className="-ml-2 h-10 rounded-xl px-2">
            <IconChevronLeft className="mr-1 h-5 w-5" />
            Back to Current Week
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Mobile: Show either list or detail. Desktop: Show both side-by-side */}
          <div className="h-full md:grid md:grid-cols-2 md:divide-x md:divide-border/65">
            {/* List of weeks */}
            <div className={`${selectedWeekStart ? "hidden md:block" : "block"} h-full overflow-y-auto`}>
              <div className="p-4 sm:p-5">
                <div className="mb-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Weekly Archive</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight">Previous Weeks</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Select a week to view details</p>
                </div>

                {historyWeeks.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-center text-muted-foreground text-sm">No history yet</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {historyWeeks.map((week) => (
                      <button
                        key={week._id}
                        onClick={() => setSelectedWeekStart(week.weekStart)}
                        className={`elevated-card w-full text-left flex items-center justify-between rounded-2xl p-4 transition-all ${
                          selectedWeekStart === week.weekStart
                            ? "border-primary/55 bg-primary/10"
                            : "hover:-translate-y-0.5 hover:border-primary/35"
                        }`}
                      >
                        <span className="text-base font-medium">{formatWeekDisplay(week)}</span>
                        <Badge
                          variant={week.status === "completed" ? "default" : "secondary"}
                          className={selectedWeekStart === week.weekStart ? "bg-primary text-primary-foreground" : ""}
                        >
                          {week.items.length}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected week details */}
            <div className={`${selectedWeekStart ? "block" : "hidden md:flex md:items-center md:justify-center"} h-full overflow-y-auto`}>
              {selectedWeekStart && selectedWeek ? (
                <div className="space-y-4 p-4 sm:p-5">
                  {/* Mobile back button and header */}
                  <div className="md:hidden">
                    <Button
                      onClick={() => setSelectedWeekStart(null)}
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
                      <h2 className="text-lg font-semibold tracking-tight">{formatWeekDisplay(selectedWeek)}</h2>
                    </div>
                    <Badge variant={selectedWeek.status === "completed" ? "default" : "secondary"} className="h-6 shrink-0 px-2.5 text-[11px] font-semibold uppercase tracking-wide">
                      {selectedWeek.status === "completed" ? "Completed" : "In Progress"}
                    </Badge>
                  </div>

                  <div className="space-y-3.5">
                    {selectedWeek.items.map((item, index) => (
                      <Card key={index} className="task-card">
                        <CardContent className="px-3 py-2.5 sm:px-3.5 sm:py-2.5">
                          <div className="task-row">
                            <div className="flex-1 min-w-0">
                              <div className="task-row">
                                <p className="task-text">{item.text}</p>
                                {item.carriedOver && (
                                  <Badge
                                    variant="outline"
                                    className="h-5 shrink-0 border-amber-300 bg-amber-50/90 text-[10px] font-semibold uppercase tracking-wide text-amber-700"
                                  >
                                    Carried Over
                                  </Badge>
                                )}
                              </div>
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
                    Select a week from the list to view details
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
