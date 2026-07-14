import React, { useState } from "react";
import * as Icons from "lucide-react";

interface ScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scheduledAt: string, timezone: string) => void;
  initialDate?: string;
  initialTimezone?: string;
}

export function ScheduleDialog({
  isOpen,
  onClose,
  onConfirm,
  initialDate,
  initialTimezone = "UTC"
}: ScheduleDialogProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timezone, setTimezone] = useState(initialTimezone);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!date || !time) return;
    const isoString = `${date}T${time}:00`;
    onConfirm(isoString, timezone);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-zinc-950 dark:text-zinc-50">
            Schedule Publishing
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
            <Icons.X size={14} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="UTC">UTC (GMT+00:00)</option>
              <option value="EST">EST (GMT-05:00)</option>
              <option value="PST">PST (GMT-08:00)</option>
              <option value="IST">IST (GMT+05:30)</option>
              <option value="GMT">GMT (GMT+00:00)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!date || !time}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md disabled:opacity-50"
          >
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

interface ApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: (notes: string) => void;
}

export function ApprovalDialog({ isOpen, onClose, onApprove, onReject }: ApprovalDialogProps) {
  const [rejectNotes, setRejectNotes] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-zinc-950 dark:text-zinc-50">
            Review Submission
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
            <Icons.X size={14} />
          </button>
        </div>

        {!isRejecting ? (
          <div className="space-y-4">
            <p className="text-xs text-zinc-500 leading-relaxed">
              Please choose whether to approve this post for schedule/publish workflow, or reject it back to drafts with comments.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRejecting(true)}
                className="px-4 py-2 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/10 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl"
              >
                Reject & Send Back
              </button>
              <button
                onClick={() => {
                  onApprove();
                  onClose();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md"
              >
                Approve Submission
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Rejection Notes</label>
              <textarea
                placeholder="Specify what needs editing (e.g. caption, media asset format...)"
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRejecting(false)}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold rounded-xl hover:bg-zinc-50"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  onReject(rejectNotes);
                  onClose();
                }}
                disabled={!rejectNotes.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-md disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface PublishDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PublishDialog({ isOpen, onClose, onConfirm }: PublishDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-xl text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
          <Icons.Globe size={22} className="animate-pulse" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-sm text-zinc-950 dark:text-zinc-50">Publish Immediately?</h3>
          <p className="text-xs text-zinc-500 leading-relaxed px-2">
            This will mark the content as published and trigger any scheduled active integrations.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md"
          >
            Publish Now
          </button>
        </div>
      </div>
    </div>
  );
}
