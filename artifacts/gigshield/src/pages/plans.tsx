import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { usePlans, useWorkerPolicies } from "@/hooks/use-policies";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { Check, ShieldAlert, Lock, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const hasValidStripeKey = Boolean(
  stripePublishableKey && stripePublishableKey !== "pk_test_replace_me",
);
const stripePromise = hasValidStripeKey ? loadStripe(stripePublishableKey as string) : null;

async function createPaymentIntent(planId: string, workerId: number, zone: string) {
  const res = await fetch("/api/payments/create-intent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("gigshield_token")}`,
    },
    body: JSON.stringify({ planId, workerId, zone }),
  });
  if (!res.ok) throw new Error("Failed to create payment intent");
  return res.json() as Promise<{ clientSecret: string; amount: number; planName: string }>;
}

async function confirmPayment(paymentIntentId: string) {
  const res = await fetch("/api/payments/confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("gigshield_token")}`,
    },
    body: JSON.stringify({ paymentIntentId }),
  });
  if (!res.ok) throw new Error("Failed to confirm payment");
  return res.json();
}

interface CheckoutFormProps {
  planName: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

function CheckoutForm({ planName, amount, onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    let error: { message?: string } | undefined;
    let paymentIntent: { id: string; status: string } | undefined;

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: "if_required",
      });
      error = result.error;
      paymentIntent = result.paymentIntent as { id: string; status: string } | undefined;
    } catch {
      setErrorMessage("Stripe failed to initialize. Check your Stripe publishable key and try again.");
      setIsProcessing(false);
      return;
    }

    if (error) {
      setErrorMessage(error.message ?? "Payment failed");
      setIsProcessing(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      try {
        await confirmPayment(paymentIntent.id);
        toast({ title: "Payment successful!", description: `You're now covered by ${planName}.` });
        onSuccess();
      } catch (err: any) {
        toast({ variant: "destructive", title: "Error activating policy", description: err.message });
      }
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-bold text-lg">{planName}</h3>
          <p className="text-muted-foreground text-sm">Weekly premium</p>
        </div>
        <span className="text-2xl font-bold text-primary">{formatCurrency(amount)}</span>
      </div>

      <div className="bg-muted/30 rounded-xl p-4 border">
        <PaymentElement
          options={{ layout: "tabs" }}
          onLoadError={() =>
            setErrorMessage(
              "Unable to load Stripe payment form. Verify Stripe keys and refresh.",
            )
          }
        />
      </div>

      {errorMessage && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3 border border-destructive/20">
          {errorMessage}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={!stripe || isProcessing}>
          <Lock className="h-4 w-4 mr-2" />
          {isProcessing ? "Processing..." : `Pay ${formatCurrency(amount)}`}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
        <Lock className="h-3 w-3" /> Secured by Stripe. We never store your card details.
      </p>
    </form>
  );
}

interface CheckoutModalProps {
  planId: string;
  workerId: number;
  zone: string;
  onSuccess: () => void;
  onClose: () => void;
}

function CheckoutModal({ planId, workerId, zone, onSuccess, onClose }: CheckoutModalProps) {
  const [intentData, setIntentData] = useState<{ clientSecret: string; amount: number; planName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasValidStripeKey) {
      setError("Stripe publishable key is missing or invalid. Update VITE_STRIPE_PUBLISHABLE_KEY.");
      setLoading(false);
      return;
    }

    createPaymentIntent(planId, workerId, zone)
      .then(setIntentData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [planId, workerId, zone]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div>
            <CardTitle className="text-xl">Activate Coverage</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Your weekly plan renews automatically</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </CardHeader>
        <CardContent className="pt-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          )}
          {error && (
            <div className="text-center py-8">
              <p className="text-destructive font-medium">{error}</p>
              <Button variant="outline" className="mt-4" onClick={onClose}>Close</Button>
            </div>
          )}
          {intentData && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: intentData.clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: { colorPrimary: "#2563eb", borderRadius: "12px" },
                },
              }}
            >
              <CheckoutForm
                planName={intentData.planName}
                amount={intentData.amount}
                onSuccess={() => { onSuccess(); onClose(); }}
                onCancel={onClose}
              />
            </Elements>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function Plans() {
  const { user } = useAuth();
  const { data, isLoading } = usePlans();
  const { data: policiesData, refetch } = useWorkerPolicies(user?.id || 0);
  const queryClient = useQueryClient();
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);

  const activePolicy = policiesData?.policies.find(p => p.status === "active");

  const handleSuccess = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["worker-policies"] });
  };

  if (isLoading) return (
    <div className="p-8 flex justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {checkoutPlan && user && (
        <CheckoutModal
          planId={checkoutPlan}
          workerId={user.id}
          zone={user.zone}
          onSuccess={handleSuccess}
          onClose={() => setCheckoutPlan(null)}
        />
      )}

      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-display font-bold">Choose Your Protection</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Simple weekly premiums. Automatic payouts. Pick the plan that fits your risk appetite.
        </p>
        {!hasValidStripeKey && (
          <p className="text-sm text-destructive">
            Stripe is not configured. Set VITE_STRIPE_PUBLISHABLE_KEY in the frontend .env file.
          </p>
        )}
      </div>

      {activePolicy && (
        <Card className="bg-primary/5 border-primary/20 mb-8">
          <CardContent className="p-6 flex items-center gap-4">
            <ShieldAlert className="h-8 w-8 text-primary" />
            <div>
              <h3 className="font-bold text-lg">Current Active Plan: {activePolicy.planName}</h3>
              <p className="text-muted-foreground">
                Paying {formatCurrency(activePolicy.weeklyPremium)}/week · up to {formatCurrency(activePolicy.maxPayoutPerWeek)} coverage
              </p>
            </div>
            <Badge variant="outline" className="ml-auto border-green-500 text-green-600 bg-green-50">Active</Badge>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-8 items-start">
        {data?.plans.map((plan) => {
          const isActive = activePolicy?.planId === plan.id;
          const isPremium = plan.name.toLowerCase().includes("premium");

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col ${isPremium ? "border-primary shadow-xl md:-mt-4" : "border shadow-sm"}`}
            >
              {isPremium && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow">
                  Most Popular
                </div>
              )}
              <CardHeader className="text-center pb-6 border-b bg-muted/20 rounded-t-xl">
                <CardTitle className="text-2xl mb-1">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground min-h-[40px]">{plan.description}</p>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{formatCurrency(plan.weeklyPremium)}</span>
                  <span className="text-muted-foreground font-medium">/week</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Up to <strong>{formatCurrency(plan.maxPayoutPerWeek)}</strong> coverage/week
                </p>
              </CardHeader>
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="space-y-3 flex-1 mb-6">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground/80">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  variant={isPremium ? "default" : "outline"}
                  disabled={isActive}
                  onClick={() => setCheckoutPlan(plan.id)}
                >
                  {isActive ? "✓ Current Plan" : `Get ${plan.name.split(" ")[0]}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2 mt-8">
        <Lock className="h-4 w-4" />
        All payments are processed securely via Stripe. Cancel anytime.
      </p>
    </div>
  );
}
