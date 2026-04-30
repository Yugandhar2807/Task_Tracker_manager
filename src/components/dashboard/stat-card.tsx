"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: "indigo" | "emerald" | "amber" | "rose" | "sky";
  delta?: { value: number; positive: boolean } | null;
  index?: number;
};

const accentMap = {
  indigo: "from-indigo-500/15 to-indigo-500/5 text-indigo-500",
  emerald: "from-emerald-500/15 to-emerald-500/5 text-emerald-500",
  amber: "from-amber-500/15 to-amber-500/5 text-amber-500",
  rose: "from-rose-500/15 to-rose-500/5 text-rose-500",
  sky: "from-sky-500/15 to-sky-500/5 text-sky-500",
};

export function StatCard({ label, value, icon, accent = "indigo", delta, index = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className="relative overflow-hidden glass hover:shadow-md transition-shadow">
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70",
            accentMap[accent],
          )}
        />
        <CardContent className="relative p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-background/60 [&_svg]:size-4", accentMap[accent].split(" ").pop())}>
              {icon}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {delta && (
              <span className={cn("text-xs font-medium", delta.positive ? "text-emerald-500" : "text-rose-500")}>
                {delta.positive ? "+" : ""}
                {delta.value}%
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
