import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, FileText } from "lucide-react";
import { useUser } from "@/lib/userContext";

interface EmailRecipient {
  name: string;
  email: string;
  dailyApps: number;
  dailyGoal: number;
  qaScore: number;
}

interface EmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: EmailRecipient | null;
}

export function EmailDialog({ isOpen, onClose, recipient }: EmailDialogProps) {
  const { currentUser } = useUser();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [template, setTemplate] = useState("");

  // Reset fields when recipient changes
  useEffect(() => {
    if (recipient) {
      setSubject("");
      setMessage("");
      setTemplate("");
    }
  }, [recipient]);

  const handleTemplateChange = (value: string) => {
    setTemplate(value);
    if (!recipient) return;

    if (value === "congrats") {
      setSubject("Great job hitting your daily goal! 🎉");
      setMessage(`Hi ${recipient.name.split(' ')[0]},

Just wanted to reach out and congratulate you on hitting your daily application goal! consistently hitting these targets is what drives our success.

Keep up the fantastic momentum!

Best,
${currentUser.name}`);
    } else if (value === "checkin") {
      setSubject("Checking in on your progress");
      setMessage(`Hi ${recipient.name.split(' ')[0]},

I noticed your current metrics for the day:
- Apps Submitted: ${recipient.dailyApps}/${recipient.dailyGoal}
- QA Score: ${recipient.qaScore}%

How are you finding the workflow today? Let me know if there are any blockers I can help with to get those numbers up.

Best,
${currentUser.name}`);
    }
  };

  if (!recipient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#0a0a0a] border-white/10 text-white sm:max-w-[600px] shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Compose Email</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-[80px_1fr] items-center gap-4">
            <Label className="text-right text-muted-foreground text-xs uppercase tracking-wider">From</Label>
            <Input 
              value={currentUser.email} 
              disabled 
              className="bg-white/5 border-white/10 text-muted-foreground h-9"
            />
          </div>
          
          <div className="grid grid-cols-[80px_1fr] items-center gap-4">
            <Label className="text-right text-muted-foreground text-xs uppercase tracking-wider">To</Label>
            <Input 
              value={`${recipient.name} <user@jumpseat.com>`} 
              disabled 
              className="bg-white/5 border-white/10 text-white h-9"
            />
          </div>

          <div className="grid grid-cols-[80px_1fr] items-center gap-4">
            <Label htmlFor="subject" className="text-right text-muted-foreground text-xs uppercase tracking-wider">Subject</Label>
            <Input 
              id="subject" 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)}
              className="bg-transparent border-white/10 text-white focus-visible:ring-primary/50 h-9"
              placeholder="Subject line..."
            />
          </div>

          <div className="grid grid-cols-[80px_1fr] gap-4 pt-2">
            <Label htmlFor="message" className="text-right text-muted-foreground text-xs uppercase tracking-wider mt-2">Message</Label>
            <Textarea 
              id="message" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-transparent border-white/10 text-white focus-visible:ring-primary/50 min-h-[200px] resize-none leading-relaxed"
              placeholder="Type your message here..."
            />
          </div>

          <div className="grid grid-cols-[80px_1fr] items-center gap-4">
             <div className="text-right">
               <FileText className="w-4 h-4 text-muted-foreground ml-auto" />
             </div>
             <Select value={template} onValueChange={handleTemplateChange}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white h-9">
                <SelectValue placeholder="Insert Template..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="congrats">🎉 Congratulate Daily Goal</SelectItem>
                <SelectItem value="checkin">📊 Progress Check-in</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-white/10 hover:bg-white/5 hover:text-white">
            Cancel
          </Button>
          <Button onClick={onClose} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
            <Send className="w-4 h-4 mr-2" />
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}