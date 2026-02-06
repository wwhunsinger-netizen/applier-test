import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Loader2, CheckCircle2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { fetchClient } from "@/lib/api";
import { useUser } from "@/lib/userContext";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function ClientJobCriteriaPage() {
  const { currentUser } = useUser();
  const [isOpen, setIsOpen] = useState(true);

  // Check if this is a real Supabase UUID
  const isRealClientId = Boolean(
    currentUser?.id &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        currentUser?.id,
      ),
  );

  // Fetch client data
  const { data: client, isLoading } = useQuery({
    queryKey: ["client", currentUser?.id],
    queryFn: () => fetchClient(currentUser?.id!),
    enabled: isRealClientId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Job Criteria
          </h1>
          <p className="text-muted-foreground mt-1">
            Your job search preferences and settings.
          </p>
        </div>
        <Card className="bg-[#111] border-white/10">
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              No Criteria Set
            </h2>
            <p className="text-muted-foreground">
              Your job criteria hasn't been configured yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const targetJobTitles = client.target_job_titles || [];
  const requiredSkills = client.required_skills || [];
  const niceToHaveSkills = client.nice_to_have_skills || [];
  const excludeKeywords = client.exclude_keywords || [];
  const yearsOfExperience = client.years_of_experience || 0;
  const seniorityLevels = client.seniority_levels || [];

  const seniorityLabels: Record<string, string> = {
    entry: "Entry Level",
    mid: "Mid Level",
    senior: "Senior",
    lead: "Lead / Principal",
    director: "Director",
    executive: "Executive",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Job Criteria
        </h1>
        <p className="text-muted-foreground mt-1">
          Your job search preferences and settings.
        </p>
      </div>

      {/* Job Criteria & Settings */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="bg-[#111] border-white/10">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-4 cursor-pointer hover:bg-white/5 transition-colors rounded-t-lg">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Job Criteria & Settings
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Target Job Titles */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  Target Job Titles
                </label>
                <div className="flex flex-wrap gap-2">
                  {targetJobTitles.length > 0 ? (
                    targetJobTitles.map((title: string, idx: number) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-primary/20 text-primary border-primary/30 px-3 py-1"
                      >
                        {title}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No target titles set
                    </span>
                  )}
                </div>
              </div>

              {/* Required Skills */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  Required Skills
                </label>
                <div className="flex flex-wrap gap-2">
                  {requiredSkills.length > 0 ? (
                    requiredSkills.map((skill: string, idx: number) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1"
                      >
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No required skills set
                    </span>
                  )}
                </div>
              </div>

              {/* Nice to Have Skills */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  Nice-to-Have Skills
                </label>
                <div className="flex flex-wrap gap-2">
                  {niceToHaveSkills.length > 0 ? (
                    niceToHaveSkills.map((skill: string, idx: number) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-3 py-1"
                      >
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No nice-to-have skills set
                    </span>
                  )}
                </div>
              </div>

              {/* Exclude Keywords */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  Exclude Keywords
                </label>
                <p className="text-xs text-muted-foreground">
                  Jobs with these keywords will be skipped
                </p>
                <div className="flex flex-wrap gap-2">
                  {excludeKeywords.length > 0 ? (
                    excludeKeywords.map((keyword: string, idx: number) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-red-500/20 text-red-400 border-red-500/30 px-3 py-1"
                      >
                        {keyword}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No exclude keywords set
                    </span>
                  )}
                </div>
              </div>

              {/* Experience, Salary & Seniority */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">
                    Years of Experience
                  </label>
                  <div className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white">
                    {yearsOfExperience}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">
                    Minimum Salary
                  </label>
                  <div className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white">
                    {client.min_salary ? `$${client.min_salary.toLocaleString()}` : "Not set"}
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-white">
                    Seniority Levels (select multiple)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "entry", label: "Entry Level" },
                      { value: "mid", label: "Mid Level" },
                      { value: "senior", label: "Senior" },
                      { value: "lead", label: "Lead / Principal" },
                      { value: "director", label: "Director" },
                      { value: "executive", label: "Executive" },
                    ].map((level) => (
                      <Badge
                        key={level.value}
                        variant={
                          seniorityLevels.includes(level.value)
                            ? "default"
                            : "outline"
                        }
                        className={cn(
                          "transition-all",
                          seniorityLevels.includes(level.value)
                            ? "bg-primary text-primary-foreground"
                            : "bg-white/5 border-white/20 text-muted-foreground",
                        )}
                      >
                        {seniorityLevels.includes(level.value) && (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        )}
                        {level.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact Support Note */}
              <div className="pt-4 border-t border-white/10">
                <p className="text-sm text-muted-foreground">
                  Need to update your job criteria? Contact your job search
                  consultant.
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
