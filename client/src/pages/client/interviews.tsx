import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Briefcase,
  ExternalLink,
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
} from "lucide-react";
import { useUser } from "@/lib/userContext";
import { apiFetch } from "@/lib/api";
import type { Application } from "@shared/schema";
import { format } from "date-fns";

export default function ClientInterviewsPage() {
  const { currentUser } = useUser();
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [prepDocModalOpen, setPrepDocModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  // Fetch applications with interview status for this client
  const { data: interviewApps = [], isLoading } = useQuery({
    queryKey: ["client-interviews", currentUser?.id],
    queryFn: async () => {
      const response = await apiFetch(
        `/api/applications?client_id=${currentUser?.id}`,
      );
      if (!response.ok) throw new Error("Failed to fetch applications");
      const apps = await response.json();
      return apps.filter((app: Application) => app.status === "Interview");
    },
    enabled: !!currentUser?.id,
  });

  // Open prep doc modal
  const openPrepDoc = (app: Application) => {
    setSelectedApp(app);
    setPrepDocModalOpen(true);
  };

  // Simple markdown to HTML converter (dark mode with red accents)
  const markdownToHtml = (markdown: string): string => {
    return (
      markdown
        // Headers
        .replace(
          /^### (.+)$/gm,
          '<h3 style="font-size: 16px; font-weight: 600; color: #ef4444; margin: 24px 0 12px 0;">$1</h3>',
        )
        .replace(
          /^## (.+)$/gm,
          '<h2 style="font-size: 18px; font-weight: 600; color: #ef4444; margin: 28px 0 14px 0;">$1</h2>',
        )
        // Bold
        .replace(
          /\*\*(.+?)\*\*/g,
          '<strong style="font-weight: 600; color: #ffffff;">$1</strong>',
        )
        // Italic
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        // Bullet points
        .replace(
          /^- (.+)$/gm,
          '<li style="margin: 6px 0; margin-left: 20px;">$1</li>',
        )
        // Numbered lists
        .replace(
          /^\d+\. (.+)$/gm,
          '<li style="margin: 6px 0; margin-left: 20px;">$1</li>',
        )
        // Horizontal rules
        .replace(
          /^---$/gm,
          '<hr style="border: none; border-top: 1px solid #333; margin: 24px 0;">',
        )
        // Line breaks (preserve paragraphs)
        .replace(/\n\n/g, '</p><p style="margin: 12px 0;">')
        // Wrap in paragraph
        .replace(/^(?!<)/, '<p style="margin: 12px 0;">')
        .replace(/(?<!>)$/, "</p>")
    );
  };

  // Generate and download PDF
  const downloadPdf = async (app: Application) => {
    console.log("Starting PDF generation for app:", app.id, app.company_name);
    setGeneratingPdfId(app.id);
    console.log("Set generatingPdfId to:", app.id);

    try {
      // Dynamically import html2pdf
      const html2pdf = (await import("html2pdf.js")).default;

      // Convert markdown to HTML
      const prepDocHtml = markdownToHtml(
        (app as any).prep_doc || "No prep document available.",
      );

      // Create a temporary container with styled content (dark mode with red accents)
      const container = document.createElement("div");
      container.innerHTML = `
        <div style="font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #e5e5e5; background-color: #0a0a0a; max-width: 800px;">
          <div style="border-bottom: 3px solid #ef4444; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="margin: 0 0 8px 0; font-size: 28px; color: #ffffff;">Interview Prep</h1>
            <h2 style="margin: 0 0 4px 0; font-size: 20px; color: #ef4444; font-weight: 600;">${app.company_name}</h2>
            <p style="margin: 0; font-size: 16px; color: #a3a3a3;">${app.job_title}</p>
          </div>
          <div style="font-size: 14px; line-height: 1.8; color: #d4d4d4;">${prepDocHtml}</div>
        </div>
      `;

      const opt = {
        margin: 0,
        filename: `Interview_Prep_${app.company_name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#0a0a0a" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      } as any;

      await html2pdf().set(opt).from(container).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      console.log("Resetting generatingPdfId to null");
      setGeneratingPdfId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Interviews
          </h1>
          <p className="text-muted-foreground mt-1">
            Your upcoming interviews and prep materials.
          </p>
        </div>
      </div>

      {/* Content */}
      {interviewApps.length === 0 ? (
        <Card className="bg-[#111] border-white/10">
          <CardContent className="p-0">
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <Calendar className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-400 mb-2">
                No Interviews Yet
              </h3>
              <p className="text-muted-foreground max-w-md">
                Your interview schedule will appear here once you start
                receiving interview invitations. We'll help you prepare with
                custom prep documents for each interview.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {interviewApps.map((app: Application) => (
            <Card
              key={app.id}
              className="bg-[#111] border-white/10 hover:border-white/20 transition-colors"
            >
              <CardContent className="p-6">
                {/* Main row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-7 h-7 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {app.company_name}
                      </h3>
                      <p className="text-muted-foreground mt-1">
                        {app.job_title}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Applied{" "}
                          {app.applied_date
                            ? format(new Date(app.applied_date), "MMM d, yyyy")
                            : "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Prep doc status */}
                    {(app as any).prep_doc ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Prep Ready
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        Prep Pending
                      </Badge>
                    )}

                    {/* Download PDF button */}
                    {(app as any).prep_doc && (
                      <Button
                        key={`download-${app.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log(
                            "Button clicked for app:",
                            app.id,
                            app.company_name,
                          );
                          downloadPdf(app);
                        }}
                        disabled={generatingPdfId === app.id}
                        className="gap-2"
                      >
                        {generatingPdfId === app.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        Download Prep PDF
                      </Button>
                    )}

                    {/* View Job button */}
                    {app.job_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(app.job_url, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}

                    {/* Expand/Collapse (only if prep doc exists) */}
                    {(app as any).prep_doc && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedAppId(
                            expandedAppId === app.id ? null : app.id,
                          )
                        }
                      >
                        {expandedAppId === app.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expanded content - show prep doc preview */}
                {expandedAppId === app.id && (app as any).prep_doc && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-white">
                        Interview Prep Document
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadPdf(app)}
                        disabled={generatingPdfId === app.id}
                        className="gap-2"
                      >
                        {generatingPdfId === app.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        Download PDF
                      </Button>
                    </div>
                    <div className="bg-black/50 rounded-lg p-6 text-sm text-muted-foreground whitespace-pre-wrap max-h-96 overflow-y-auto prose prose-invert prose-sm max-w-none">
                      {(app as any).prep_doc}
                    </div>
                  </div>
                )}

                {/* Message when prep doc is pending */}
                {!(app as any).prep_doc && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-sm text-muted-foreground">
                      Your interview prep document is being prepared. Check back
                      soon!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Full Prep Doc Modal */}
      <Dialog open={prepDocModalOpen} onOpenChange={setPrepDocModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Interview Prep: {selectedApp?.company_name}
            </DialogTitle>
            <p className="text-muted-foreground">{selectedApp?.job_title}</p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto mt-4" ref={pdfContentRef}>
            <div className="bg-black/30 rounded-lg p-6 text-sm whitespace-pre-wrap prose prose-invert prose-sm max-w-none">
              {(selectedApp as any)?.prep_doc || "No prep doc available."}
            </div>
          </div>
          <div className="flex justify-between pt-4 border-t border-white/10 mt-4">
            <Button
              variant="outline"
              onClick={() => selectedApp && downloadPdf(selectedApp)}
              disabled={
                selectedApp ? generatingPdfId === selectedApp.id : false
              }
              className="gap-2"
            >
              {selectedApp && generatingPdfId === selectedApp.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => setPrepDocModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
