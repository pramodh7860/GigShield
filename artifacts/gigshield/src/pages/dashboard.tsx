import { useAuth } from "@/hooks/use-auth";
import { useDashboard } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ShieldCheck, ShieldAlert, AlertTriangle, TrendingUp, IndianRupee, CloudLightning, FileText } from "lucide-react";
import { Link } from "wouter";

export function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading, error } = useDashboard(user?.id || 0);

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (error || !data) return <div className="p-8 text-center text-destructive">Failed to load dashboard data.</div>;

  const isCovered = data.coverageStatus === "active";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Welcome back, {user?.name}</h1>
          <p className="text-muted-foreground">Here's your coverage overview for {data.worker.zone}</p>
        </div>
        {!isCovered && (
          <Link href="/plans">
            <Button size="lg" className="animate-pulse">Get Covered Now</Button>
          </Link>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Status Card */}
        <Card className={`md:col-span-2 shadow-lg border-2 ${isCovered ? 'border-success/50 bg-success/5' : 'border-warning/50 bg-warning/5'}`}>
          <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className={`p-4 rounded-full ${isCovered ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                {isCovered ? <ShieldCheck className="h-12 w-12" /> : <ShieldAlert className="h-12 w-12" />}
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  {isCovered ? "You are fully covered" : "No active coverage"}
                </h2>
                {isCovered && data.activePolicy ? (
                  <p className="text-muted-foreground">
                    {data.activePolicy.planName} Plan • Renews {data.activePolicy.endDate ? format(new Date(data.activePolicy.endDate), 'MMM d') : 'Weekly'}
                  </p>
                ) : (
                  <p className="text-muted-foreground">Subscribe to a plan to protect your earnings.</p>
                )}
              </div>
            </div>
            {isCovered && (
              <div className="text-right">
                <div className="text-sm font-medium text-muted-foreground mb-1">Max Weekly Payout</div>
                <div className="text-3xl font-bold text-foreground">{formatCurrency(data.activePolicy?.maxPayoutPerWeek || 0)}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Alerts Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Live Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {data.recentTriggers.length > 0 ? (
              <div className="space-y-4">
                {data.recentTriggers.slice(0, 3).map(trigger => (
                  <div key={trigger.id} className="flex gap-3">
                    <div className="mt-0.5"><CloudLightning className="h-4 w-4 text-warning" /></div>
                    <div>
                      <p className="text-sm font-semibold">{trigger.type.toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(trigger.createdAt), 'h:mm a')} • {trigger.zone}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground flex flex-col items-center">
                <ShieldCheck className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">Conditions are normal in your zone.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl"><IndianRupee className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Paid Out</p>
              <h3 className="text-2xl font-bold">{formatCurrency(data.totalPaid)}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-xl"><TrendingUp className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Protected Earnings</p>
              <h3 className="text-2xl font-bold">{formatCurrency(data.totalEarningsProtected)}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl"><FileText className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Claims</p>
              <h3 className="text-2xl font-bold">{data.totalClaims}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle>Recent Claims</CardTitle>
          <Link href="/claims"><Button variant="outline" size="sm">View All</Button></Link>
        </CardHeader>
        <CardContent className="p-0">
          {data.recentClaims.length > 0 ? (
            <div className="divide-y">
              {data.recentClaims.map((claim) => (
                <div key={claim.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-secondary p-2 rounded-lg">
                      <CloudLightning className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{claim.triggerType.replace('_', ' ').toUpperCase()}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(claim.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="font-bold">{formatCurrency(claim.amount)}</span>
                    <Badge variant={
                      claim.status === 'paid' ? 'success' : 
                      claim.status === 'rejected' ? 'destructive' : 
                      claim.status === 'approved' ? 'default' : 'warning'
                    }>
                      {claim.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">No claims yet. That's good news!</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
