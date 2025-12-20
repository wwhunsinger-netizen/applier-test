import { MOCK_LEADERBOARD } from "@/lib/mockData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground">Top performers this month. Keep pushing!</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Top 3 Cards */}
        {[0, 1, 2].map((i) => {
          const entry = MOCK_LEADERBOARD[i];
          const color = i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : "text-orange-500";
          const bg = i === 0 ? "bg-yellow-500/10" : i === 1 ? "bg-gray-400/10" : "bg-orange-500/10";
          
          return (
            <Card key={i} className={cn("border-t-4", i === 0 ? "border-t-yellow-500" : i === 1 ? "border-t-gray-400" : "border-t-orange-500")}>
              <CardContent className="pt-6 text-center space-y-4">
                <div className={cn("w-16 h-16 rounded-full mx-auto flex items-center justify-center", bg)}>
                  <Trophy className={cn("w-8 h-8", color)} />
                </div>
                <div>
                  <div className="text-2xl font-bold">{entry.name}</div>
                  <div className="text-muted-foreground text-sm">Rank #{entry.rank}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm border-t border-border pt-4">
                  <div>
                    <div className="font-bold">{entry.apps}</div>
                    <div className="text-muted-foreground text-xs">Apps</div>
                  </div>
                  <div>
                    <div className="font-bold text-success">{entry.earnings}</div>
                    <div className="text-muted-foreground text-xs">Earned</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Full Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Rank</TableHead>
                <TableHead>Applier</TableHead>
                <TableHead>Applications</TableHead>
                <TableHead>Interview Rate</TableHead>
                <TableHead className="text-right">Earnings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_LEADERBOARD.map((entry) => (
                <TableRow key={entry.rank} className={cn(entry.isCurrentUser && "bg-primary/5 hover:bg-primary/10")}>
                  <TableCell className="font-medium">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                       entry.rank <= 3 ? "bg-muted text-foreground" : "text-muted-foreground"
                    )}>
                      {entry.rank}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {entry.name}
                    {entry.isCurrentUser && <Badge variant="secondary" className="ml-2 text-[10px]">YOU</Badge>}
                  </TableCell>
                  <TableCell>{entry.apps}</TableCell>
                  <TableCell>{entry.interviewRate}</TableCell>
                  <TableCell className="text-right font-mono">{entry.earnings}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}