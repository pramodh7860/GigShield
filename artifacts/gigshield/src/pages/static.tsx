import { Card, CardContent } from "@/components/ui";

export function About() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
      <h1 className="text-4xl font-display font-bold">About GigShield</h1>
      <div className="prose prose-slate lg:prose-lg dark:prose-invert">
        <p>GigShield was built to solve a critical problem for India's 15 million gig workers: income volatility caused by external factors outside their control.</p>
        <p>When heavy monsoon rains flood the streets, or extreme heatwaves make riding dangerous, delivery partners often have to choose between their safety and their daily earnings. Traditional insurance doesn't cover this "loss of income", and if it did, the claims process would take weeks.</p>
        <h3>Parametric Insurance: A New Paradigm</h3>
        <p>GigShield uses a model called <strong>Parametric Insurance</strong>. Instead of indemnifying the actual loss (which requires proof, forms, and adjusters), we insure against a specific <em>event</em> (the parameter).</p>
        <ul>
          <li>We monitor IMD APIs for weather in specific zones.</li>
          <li>We monitor platform APIs and social signals for outages.</li>
          <li>When a predefined threshold is crossed (e.g., more than 15mm rainfall in 1 hour in Koramangala), the trigger fires.</li>
          <li>Every active policyholder in that zone immediately receives a payout to their wallet. No questions asked.</li>
        </ul>
      </div>
    </div>
  );
}

export function FAQ() {
  const faqs = [
    { q: "How do I file a claim?", a: "You don't! That's the magic of GigShield. If you have an active policy and a qualifying event occurs in your zone, we automatically credit the payout to your account within 24 hours." },
    { q: "What happens if I change my working zone?", a: "You can update your active zone in your Profile settings. Your coverage will automatically shift to the new zone starting the next policy week." },
    { q: "Can I cancel my subscription?", a: "Yes, you can cancel your weekly auto-renewal at any time from the dashboard. You will remain covered until the end of the current billing cycle." },
  ];

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-8">
      <h1 className="text-4xl font-display font-bold text-center mb-12">Frequently Asked Questions</h1>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-2">{faq.q}</h3>
              <p className="text-muted-foreground">{faq.a}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
