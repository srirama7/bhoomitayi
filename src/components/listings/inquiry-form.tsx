"use client";

import { useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, addDoc } from "firebase/firestore";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Send } from "lucide-react";
import Link from "next/link";

interface InquiryFormProps {
  listingId: string;
  ownerName: string;
}

export function InquiryForm({ listingId, ownerName }: InquiryFormProps) {
  const { user } = useAuthStore();
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800/80 shadow-3d bg-white dark:bg-zinc-900/80">
        <CardContent className="py-6 text-center">
          <p className="text-muted-foreground mb-3">Login to contact the owner</p>
          <Button asChild>
            <Link href={`/auth/login?redirectTo=/listing/${listingId}`}>Login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "inquiries"), {
        listing_id: listingId,
        sender_id: user.uid,
        message: message.trim(),
        phone: phone.trim() || null,
        created_at: new Date().toISOString(),
      });
      toast.success("Inquiry sent successfully!");
      setMessage("");
      setPhone("");
    } catch {
      toast.error("Failed to send inquiry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800/80 shadow-3d bg-white dark:bg-zinc-900/80">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Contact {ownerName}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="I'm interested in this property..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            <Send className="h-4 w-4 mr-2" />
            {loading ? "Sending..." : "Send Inquiry"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
