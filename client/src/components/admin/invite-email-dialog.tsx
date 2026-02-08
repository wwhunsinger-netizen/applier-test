import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, ExternalLink } from "lucide-react";
import type { TestSubmission } from "@shared/schema";

const CALENDLY_LINK = "https://calendly.com/wyedoyoudothis/applier-onboarding";

interface InviteEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: () => void;
  submission: TestSubmission | null;
  isSending: boolean;
}

export function InviteEmailDialog({ isOpen, onClose, onSend, submission, isSending }: InviteEmailDialogProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (submission) {
      const firstName = submission.candidate_name.split(" ")[0];
      const calendlyUrl = `${CALENDLY_LINK}?name=${encodeURIComponent(submission.candidate_name)}&email=${encodeURIComponent(submission.candidate_email)}`;

      setSubject("You passed the Jumpseat assessment — next step inside");
      setMessage(`Hi ${firstName},

Great news — you passed our applier assessment with a score of ${submission.overall_score}%.

We'd love to bring you on board. The next step is to join a group onboarding call where we'll walk you through the platform and get you set up with your first client.

Book your onboarding slot here:
${calendlyUrl}

Looking forward to working with you!

Best,
Wilson`);
    }
  }, [submission]);

  if (!submission) return null;

  const handleSend = () => {
    // Open Gmail compose with the email content
    const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(submission.candidate_email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.open(gmailUrl, "_blank");
    onSend();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#0a0a0a] border-white/10 text-white sm:max-w-[600px] shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Invite to Onboarding</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-[80px_1fr] items-center gap-4">
            <Label className="text-right text-muted-foreground text-xs uppercase tracking-wider">To</Label>
            <Input
              value={`${submission.candidate_name} <${submission.candidate_email}>`}
              disabled
              className="bg-white/5 border-white/10 text-white h-9"
            />
          </div>

          <div className="grid grid-cols-[80px_1fr] items-center gap-4">
            <Label className="text-right text-muted-foreground text-xs uppercase tracking-wider">Score</Label>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-white font-semibold">{submission.overall_score}%</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">Typing {submission.typing_wpm} WPM</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">Reviews {submission.review_score}%</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">App {submission.app_correct_count}/{submission.app_total_scored}</span>
            </div>
          </div>

          <div className="grid grid-cols-[80px_1fr] items-center gap-4">
            <Label htmlFor="invite-subject" className="text-right text-muted-foreground text-xs uppercase tracking-wider">Subject</Label>
            <Input
              id="invite-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-transparent border-white/10 text-white focus-visible:ring-primary/50 h-9"
            />
          </div>

          <div className="grid grid-cols-[80px_1fr] gap-4 pt-2">
            <Label htmlFor="invite-message" className="text-right text-muted-foreground text-xs uppercase tracking-wider mt-2">Message</Label>
            <Textarea
              id="invite-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-transparent border-white/10 text-white focus-visible:ring-primary/50 min-h-[250px] resize-none leading-relaxed"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-white/10 hover:bg-white/5 hover:text-white">
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !subject.trim() || !message.trim()}
            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
          >
            <Send className="w-4 h-4 mr-2" />
            Send via Gmail
            <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
