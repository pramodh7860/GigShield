import { Link } from "wouter";
import { Button } from "@/components/ui";
import { CloudRain, ThermometerSun, ShieldAlert, Zap, ArrowRight, CheckCircle2 } from "lucide-react";

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-24 pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        
        <div className="container mx-auto max-w-7xl px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center rounded-full border bg-background/50 backdrop-blur-sm px-3 py-1 text-sm font-medium text-primary mb-6">
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
                Live in 15+ Cities across India
              </div>
              <h1 className="text-5xl md:text-6xl font-display font-bold leading-tight mb-6">
                Your gig earnings, <br/>
                <span className="text-gradient">protected automatically.</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Parametric insurance for delivery partners. When heavy rain, extreme heat, or app outages stop you from working, GigShield pays you instantly. Zero claims to file.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto group">
                    Get Covered Now
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/plans">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-background">
                    View Plans
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-3xl" />
              <img 
                src={`${import.meta.env.BASE_URL}images/hero-abstract.png`} 
                alt="GigShield Protection" 
                className="relative z-10 w-full object-contain animate-in fade-in slide-in-from-bottom-8 duration-1000"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Coverage Section */}
      <section className="py-24 bg-card border-y">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-display font-bold mb-4">We've got your back when things go wrong</h2>
            <p className="text-muted-foreground text-lg">Our system monitors local conditions 24/7. When a trigger is hit, your payout is processed automatically.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: CloudRain, title: "Heavy Rainfall", desc: "> 10mm/hr rainfall in your active zone", color: "text-blue-500", bg: "bg-blue-500/10" },
              { icon: ThermometerSun, title: "Extreme Heat", desc: "Temperatures exceeding 42°C (107°F)", color: "text-orange-500", bg: "bg-orange-500/10" },
              { icon: ShieldAlert, title: "City Curfews", desc: "Unexpected lockdowns or movement restrictions", color: "text-red-500", bg: "bg-red-500/10" },
              { icon: Zap, title: "Platform Outages", desc: "Zomato/Swiggy server downtime > 1 hour", color: "text-purple-500", bg: "bg-purple-500/10" },
            ].map((feature, i) => (
              <div key={i} className="bg-background rounded-2xl p-6 border shadow-sm card-hover">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${feature.bg}`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-background">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-8">No forms. No claims adjusters. No delays.</h2>
              <div className="space-y-8">
                {[
                  { step: "1", title: "Subscribe weekly", desc: "Choose a plan starting at just ₹25/week based on your platform and zone." },
                  { step: "2", title: "System monitors triggers", desc: "We track weather and platform statuses in real-time." },
                  { step: "3", title: "Instant payout", desc: "If a disruption occurs, money is sent straight to your wallet." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-1">{item.title}</h4>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              {/* landing page delivery rider on bike during rain */}
              <img 
                src="https://pixabay.com/get/gd162026d1edefe41519855f0bf6004c05298e72ea8787f73bd9a07f26894d6fee4fe7135a07e43a2bf91ce6d51635849a6a25d2ddf7aabc551fafd0edf2f6943_1280.jpg" 
                alt="Delivery rider" 
                className="rounded-2xl shadow-2xl object-cover h-[500px] w-full"
              />
              <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-2xl shadow-xl border max-w-xs animate-bounce" style={{animationDuration: '3s'}}>
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="text-success h-6 w-6" />
                  <span className="font-bold text-sm">Payout Approved</span>
                </div>
                <p className="text-sm text-muted-foreground">₹500 credited for Heavy Rain disruption in Koramangala.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
