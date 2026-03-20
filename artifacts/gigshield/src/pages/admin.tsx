import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAdminOverview, useAdminWorkers, useAdminClaims, useAdminTriggers, useSimulateTrigger, useAdminUpdateClaim } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Label, Dialog } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, Users, FileText, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "workers" | "claims" | "triggers">("overview");

  if (user?.role !== "admin") return <div className="p-8">Unauthorized access.</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Admin Portal</h1>
        <p className="text-muted-foreground">Manage policies, claims, and trigger events.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 border-b">
        {[
          { id: "overview", label: "Overview", icon: Activity },
          { id: "workers", label: "Workers", icon: Users },
          { id: "claims", label: "Claims", icon: FileText },
          { id: "triggers", label: "Triggers", icon: Zap },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-4">
        {activeTab === "overview" && <AdminOverviewTab />}
        {activeTab === "workers" && <AdminWorkersTab />}
        {activeTab === "claims" && <AdminClaimsTab />}
        {activeTab === "triggers" && <AdminTriggersTab />}
      </div>
    </div>
  );
}

function AdminOverviewTab() {
  const { data, isLoading } = useAdminOverview();

  if (isLoading) return <div>Loading overview...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Active Workers</p>
            <h3 className="text-3xl font-bold">{data.activeWorkers} <span className="text-sm text-muted-foreground font-normal">/ {data.totalWorkers}</span></h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Pending Claims</p>
            <h3 className="text-3xl font-bold text-warning">{data.pendingClaims}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Payouts YTD</p>
            <h3 className="text-3xl font-bold text-success">{formatCurrency(data.totalPayouts)}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Fraud Alerts</p>
            <h3 className="text-3xl font-bold text-destructive">{data.fraudAlerts}</h3>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payouts by Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.triggersByZone}>
                <XAxis dataKey="zone" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="payout" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminWorkersTab() {
  const { data, isLoading } = useAdminWorkers();
  if (isLoading) return <div>Loading workers...</div>;

  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground font-medium uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Worker</th>
              <th className="px-6 py-4">Zone / Platform</th>
              <th className="px-6 py-4">Trust Score</th>
              <th className="px-6 py-4">Claims</th>
              <th className="px-6 py-4">Total Paid</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.workers.map(w => (
              <tr key={w.id} className="hover:bg-muted/30">
                <td className="px-6 py-4 font-medium">{w.name}<br/><span className="text-muted-foreground font-normal">{w.email}</span></td>
                <td className="px-6 py-4">{w.zone}<br/><span className="capitalize text-muted-foreground">{w.platform}</span></td>
                <td className="px-6 py-4">
                  <Badge variant={w.trustScore > 80 ? 'success' : w.trustScore < 50 ? 'destructive' : 'warning'}>{w.trustScore}/100</Badge>
                </td>
                <td className="px-6 py-4">{w.totalClaims}</td>
                <td className="px-6 py-4 font-semibold">{formatCurrency(w.totalPaid)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function AdminClaimsTab() {
  const { data, isLoading } = useAdminClaims();
  const updateClaim = useAdminUpdateClaim();
  const { toast } = useToast();

  const handleUpdate = async (id: number, status: string) => {
    try {
      await updateClaim.mutateAsync({ id, status });
      toast({ title: "Claim updated" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  if (isLoading) return <div>Loading claims...</div>;

  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground font-medium uppercase text-xs">
            <tr>
              <th className="px-6 py-4">ID & Date</th>
              <th className="px-6 py-4">Worker</th>
              <th className="px-6 py-4">Trigger</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Fraud Score</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.claims.map(c => (
              <tr key={c.id} className="hover:bg-muted/30">
                <td className="px-6 py-4">#{c.id}<br/><span className="text-muted-foreground">{format(new Date(c.createdAt), 'MMM d, yy')}</span></td>
                <td className="px-6 py-4">{c.workerName}</td>
                <td className="px-6 py-4 capitalize">{c.triggerType.replace('_', ' ')}<br/><span className="text-muted-foreground text-xs">{c.zone}</span></td>
                <td className="px-6 py-4 font-bold">{formatCurrency(c.amount)}</td>
                <td className="px-6 py-4 text-xs">
                  {c.fraudScore > 70 ? <span className="text-destructive font-bold">{c.fraudScore} (High)</span> : <span className="text-success">{c.fraudScore} (Low)</span>}
                </td>
                <td className="px-6 py-4"><Badge variant={c.status === 'paid' || c.status === 'approved' ? 'success' : c.status === 'rejected' ? 'destructive' : 'warning'}>{c.status}</Badge></td>
                <td className="px-6 py-4 flex gap-2">
                  {c.status === 'pending' && (
                    <>
                      <Button size="sm" variant="outline" className="text-success border-success hover:bg-success/10" onClick={() => handleUpdate(c.id, 'approved')}>Approve</Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => handleUpdate(c.id, 'rejected')}>Reject</Button>
                    </>
                  )}
                  {c.status === 'approved' && (
                    <Button size="sm" onClick={() => handleUpdate(c.id, 'paid')}>Mark Paid</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function AdminTriggersTab() {
  const { data, isLoading } = useAdminTriggers();
  const simulate = useSimulateTrigger();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'rain',
    zone: 'Koramangala, Bangalore',
    severity: 'high',
    description: 'Heavy rain detected by IMD API'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await simulate.mutateAsync(formData);
      toast({ title: "Trigger executed", description: "Claims have been automatically generated." });
      setOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setOpen(true)}><Zap className="w-4 h-4 mr-2" /> Simulate Event</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <h2 className="text-xl font-bold mb-4">Simulate Trigger Event</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Type</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
              <option value="rain">Heavy Rain</option>
              <option value="heat">Extreme Heat</option>
              <option value="platform_outage">Platform Outage</option>
            </select>
          </div>
          <div>
            <Label>Zone</Label>
            <Input value={formData.zone} onChange={e => setFormData({...formData, zone: e.target.value})} className="mt-1" />
          </div>
          <div>
            <Label>Severity</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={formData.severity} onChange={e => setFormData({...formData, severity: e.target.value as any})}>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <Button type="submit" className="w-full" isLoading={simulate.isPending}>Fire Trigger</Button>
        </form>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Event Type</th>
                <th className="px-6 py-4">Zone</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Claims Generated</th>
                <th className="px-6 py-4">Total Payout Liability</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.triggers.map(t => (
                <tr key={t.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4">{format(new Date(t.createdAt), 'MMM d, HH:mm')}</td>
                  <td className="px-6 py-4 font-semibold capitalize">{t.type.replace('_', ' ')}</td>
                  <td className="px-6 py-4">{t.zone}</td>
                  <td className="px-6 py-4"><Badge variant={t.severity === 'critical' ? 'destructive' : t.severity === 'high' ? 'warning' : 'default'}>{t.severity}</Badge></td>
                  <td className="px-6 py-4">{t.affectedWorkers}</td>
                  <td className="px-6 py-4 font-bold">{formatCurrency(t.totalPayout)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
