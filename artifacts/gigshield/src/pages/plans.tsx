import { usePlans, useSubscribeToPlan, useWorkerPolicies } from "@/hooks/use-policies";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { Check, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Plans() {
  const { user } = useAuth();
  const { data, isLoading } = usePlans();
  const { data: policiesData } = useWorkerPolicies(user?.id || 0);
  const subscribe = useSubscribeToPlan();
  const { toast } = useToast();

  const activePolicy = policiesData?.policies.find(p => p.status === 'active');

  const handleSubscribe = async (planId: string) => {
    if (!user) return;
    try {
      await subscribe.mutateAsync({
        workerId: user.id,
        planId,
        zone: user.zone
      });
      toast({ title: "Subscribed successfully!", description: "Your coverage is now active." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Subscription failed", description: err.message });
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading plans...</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-display font-bold">Choose Your Protection</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Simple weekly premiums. Automatic payouts. Pick the plan that fits your risk appetite.
        </p>
      </div>

      {activePolicy && (
        <Card className="bg-primary/5 border-primary/20 mb-8">
          <CardContent className="p-6 flex items-center gap-4">
            <ShieldAlert className="h-8 w-8 text-primary" />
            <div>
              <h3 className="font-bold text-lg">Current Active Plan: {activePolicy.planName}</h3>
              <p className="text-muted-foreground">Paying {formatCurrency(activePolicy.weeklyPremium)}/week for up to {formatCurrency(activePolicy.maxPayoutPerWeek)} coverage.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {data?.plans.map((plan) => {
          const isActive = activePolicy?.planId === plan.id;
          const isPremium = plan.name.toLowerCase().includes("premium");

          return (
            <Card key={plan.id} className={`relative flex flex-col ${isPremium ? 'border-primary shadow-xl scale-105 z-10' : 'border shadow-sm'}`}>
              {isPremium && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Most Popular
                </div>
              )}
              <CardHeader className="text-center pb-8 border-b bg-muted/20">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground min-h-[40px]">{plan.description}</p>
                <div className="mt-6 flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{formatCurrency(plan.weeklyPremium)}</span>
                  <span className="text-muted-foreground font-medium">/week</span>
                </div>
              </CardHeader>
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="mb-6">
                  <p className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Coverage Details</p>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">Max Payout</span>
                    <span className="font-bold">{formatCurrency(plan.maxPayoutPerWeek)}</span>
                  </div>
                </div>
                
                <div className="space-y-4 flex-1">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex gap-3">
                      <Check className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm text-foreground/80">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full mt-8" 
                  size="lg"
                  variant={isPremium ? "default" : "outline"}
                  disabled={isActive || subscribe.isPending}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {isActive ? "Current Plan" : subscribe.isPending ? "Processing..." : "Select Plan"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
