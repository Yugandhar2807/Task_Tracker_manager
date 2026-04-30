"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { api, ApiError } from "@/lib/api-client";
import type { Task, TaskStatus } from "@/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  nextStatus: TaskStatus;
  onComplete: (updated: Task) => void;
};

export function StatusChangeDialog({ open, onOpenChange, task, nextStatus, onComplete }: Props) {
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) setNote("");
  }, [open]);

  const requireNote = nextStatus === "DONE";

  async function submit(skipNote = false) {
    setSubmitting(true);
    try {
      // 1. Persist the status change
      const { task: updated } = await api.put<{ task: Task }>(`/api/tasks/${task.id}`, {
        status: nextStatus,
      });

      // 2. Persist the note as a comment, attached to the transition (if provided)
      const trimmed = note.trim();
      if (!skipNote && trimmed.length > 0) {
        await api.post(`/api/tasks/${task.id}/comments`, {
          message: trimmed,
          statusFrom: task.status,
          statusTo: nextStatus,
        });
      }

      toast.success(
        trimmed.length > 0
          ? `Status updated and note saved`
          : `Status → ${nextStatus.replace("_", " ")}`,
      );
      onComplete(updated);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update status</DialogTitle>
          <DialogDescription className="flex items-center gap-2 pt-1">
            <StatusBadge status={task.status} />
            <span aria-hidden>→</span>
            <StatusBadge status={nextStatus} />
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="note">
            Describe your work {requireNote ? "" : <span className="text-muted-foreground">(optional)</span>}
          </Label>
          <Textarea
            id="note"
            placeholder={
              nextStatus === "DONE"
                ? "What did you do? Any results, links, or follow-ups?"
                : nextStatus === "IN_PROGRESS"
                ? "What are you working on? Any blockers?"
                : "Anything to share before moving this back?"
            }
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Your note is saved as a comment on this task and shown to the team.
          </p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          {!requireNote && (
            <Button variant="outline" onClick={() => submit(true)} disabled={submitting}>
              Skip note
            </Button>
          )}
          <Button
            variant="gradient"
            onClick={() => submit(false)}
            disabled={submitting || (requireNote && note.trim().length === 0)}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
