import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function ClientInterviewsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Interviews</h1>
          <p className="text-muted-foreground mt-1">
            Track your upcoming interviews and access prep materials.
          </p>
        </div>
      </div>

      <Card className="bg-[#111] border-white/10">
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <Calendar className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-400 mb-2">Coming Soon</h3>
            <p className="text-muted-foreground max-w-md">
              Your interview schedule will appear here once you start receiving interview invitations. 
              We'll help you prepare with custom prep documents for each interview.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
