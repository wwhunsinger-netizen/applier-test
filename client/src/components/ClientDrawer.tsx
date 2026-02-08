import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { CLIENT_PROFILE } from "@/lib/test-data";

interface ClientDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ClientDrawer({ open, onOpenChange }: ClientDrawerProps) {
  const client = CLIENT_PROFILE;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Client Details</SheetTitle>
          <SheetDescription>
            Use these details to review applications.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Contact Info */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">
              Contact
            </h4>
            <div className="text-sm space-y-1">
              <p><span className="text-muted-foreground">Name:</span> {client.name}</p>
              <p><span className="text-muted-foreground">Email:</span> {client.email}</p>
              <p><span className="text-muted-foreground">Phone:</span> {client.phone}</p>
              <p><span className="text-muted-foreground">Location:</span> {client.location}</p>
              <p><span className="text-muted-foreground">LinkedIn:</span> {client.linkedin}</p>
            </div>
          </section>

          {/* Current Role */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">
              Current Role
            </h4>
            <div className="text-sm space-y-1">
              <p><span className="text-muted-foreground">Title:</span> {client.currentTitle}</p>
              <p><span className="text-muted-foreground">Company:</span> {client.currentCompany}</p>
              <p><span className="text-muted-foreground">Experience:</span> {client.yearsExperience} years</p>
              <p>
                <span className="text-muted-foreground">Salary pref:</span>{" "}
                <span>{client.desiredSalary}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Work style:</span>{" "}
                <span>{client.remotePreference}</span>
              </p>
            </div>
          </section>

          {/* EEO Info */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">
              EEO
            </h4>
            <div className="text-sm space-y-1">
              <p><span className="text-muted-foreground">Latino:</span> {client.latino}</p>
              <p><span className="text-muted-foreground">Protected Veteran:</span> {client.veteranStatus}</p>
            </div>
          </section>

          {/* Summary */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">
              Summary
            </h4>
            <p className="text-sm text-muted-foreground">{client.summary}</p>
          </section>

          {/* Skills */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">
              Skills
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {client.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </section>

          {/* Experience */}
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">
              Experience
            </h4>
            {client.experience.map((exp) => (
              <div key={exp.company} className="space-y-1">
                <p className="text-sm font-medium">{exp.title}</p>
                <p className="text-xs text-muted-foreground">
                  {exp.company} &middot; {exp.duration}
                </p>
                <ul className="text-xs text-muted-foreground list-disc ml-4 space-y-0.5">
                  {exp.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          {/* Education */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">
              Education
            </h4>
            {client.education.map((edu) => (
              <div key={edu.school} className="text-sm">
                <p className="font-medium">{edu.degree}</p>
                <p className="text-xs text-muted-foreground">
                  {edu.school}, {edu.year}
                </p>
              </div>
            ))}
          </section>

        </div>
      </SheetContent>
    </Sheet>
  );
}
