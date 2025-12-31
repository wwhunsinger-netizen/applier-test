import { useState } from "react";
import { Link } from "wouter";
import { MOCK_JOBS } from "@/lib/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, MapPin, Clock, Search, ArrowRight } from "lucide-react";

export default function QueuePage() {
  const [filter, setFilter] = useState("all");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Review Queue</h1>
          <p className="text-muted-foreground">53 jobs waiting for review</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search jobs..." className="pl-9 bg-background" />
          </div>
          <Select defaultValue="match">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="match">Best Match</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Client Context */}
      <div className="bg-muted/40 border border-border rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">JS</div>
          <div>
            <div className="text-sm font-medium">John Smith</div>
            <div className="text-xs text-muted-foreground">Target: Remote Software Engineer • Day 47/90</div>
          </div>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-muted-foreground block text-xs">Progress</span>
            <span className="font-mono font-medium">2,847/5k</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs">Interviews</span>
            <span className="font-mono font-medium text-success">18</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs">Pending</span>
            <span className="font-mono font-medium text-warning">2</span>
          </div>
        </div>
      </div>

      {/* Job List */}
      <div className="space-y-4">
        {MOCK_JOBS.map((job) => (
          <Card key={job.id} className="group hover:shadow-md transition-all duration-200 border-l-4 border-l-transparent hover:border-l-primary">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold font-heading">{job.role}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Building className="w-3 h-3" /> {job.company}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {job.postedTime}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-2 min-w-[160px]">
                  <Link href={`/review/${job.id}`}>
                    <Button size="lg" className="w-full shadow-lg shadow-primary/10 group-hover:translate-x-1 transition-transform">
                      Start Review
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" className="w-full text-muted-foreground">Skip Job</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        <Button variant="ghost" className="w-full py-8 text-muted-foreground border border-dashed border-border hover:bg-muted/50">
          Load more jobs...
        </Button>
      </div>
    </div>
  );
}