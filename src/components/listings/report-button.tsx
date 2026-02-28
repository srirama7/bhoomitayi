"use client";

import { useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, addDoc } from "firebase/firestore";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Flag } from "lucide-react";
import { toast } from "sonner";

export function ReportButton({ listingId }: { listingId: string }) {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please login to report");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "reports"), {
        listing_id: listingId,
        reporter_id: user.uid,
        reason: reason.trim(),
        created_at: new Date().toISOString(),
      });
      toast.success("Report submitted. Thank you!");
      setOpen(false);
      setReason("");
    } catch {
      toast.error("Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="default">
          <Flag className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this listing</DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Why are you reporting this listing?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
        />
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Submitting..." : "Submit Report"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
