import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
      await login(data);
      toast({ title: "Welcome back!", description: "Successfully logged in." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login failed", description: error.message || "Invalid credentials." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3 items-center text-center pb-8">
          <div className="bg-primary p-2 rounded-xl mb-2">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-display">Log in to GigShield</CardTitle>
          <p className="text-sm text-muted-foreground">Access your dashboard and active policies.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...form.register("email")} />
              {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input id="password" type="password" placeholder="••••••••" {...form.register("password")} />
              {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full mt-6" size="lg" isLoading={isLoading}>
              Sign In
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link href="/register" className="font-semibold text-primary hover:underline">Register here</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(10, "Phone number required"),
  zone: z.string().min(2, "Operating zone is required"),
  platform: z.enum(["zomato", "swiggy", "ubereats", "dunzo", "other"]),
});

export function Register() {
  const { register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", phone: "", zone: "", platform: "zomato" },
  });

  async function onSubmit(data: z.infer<typeof registerSchema>) {
    setIsLoading(true);
    try {
      await register(data);
      toast({ title: "Account created!", description: "Welcome to GigShield." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Registration failed", description: error.message || "Please check your details." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="space-y-3 items-center text-center pb-6">
          <div className="bg-primary p-2 rounded-xl mb-2">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-display">Create an Account</CardTitle>
          <p className="text-sm text-muted-foreground">Join GigShield and protect your earnings today.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" {...form.register("name")} />
                {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="9876543210" {...form.register("phone")} />
                {form.formState.errors.phone && <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" {...form.register("email")} />
              {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" {...form.register("password")} />
              {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="platform">Primary Platform</Label>
                <select 
                  id="platform" 
                  className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  {...form.register("platform")}
                >
                  <option value="zomato">Zomato</option>
                  <option value="swiggy">Swiggy</option>
                  <option value="ubereats">Uber Eats</option>
                  <option value="dunzo">Dunzo</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zone">Operating Zone</Label>
                <select 
                  id="zone" 
                  className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  {...form.register("zone")}
                >
                  <option value="">Select City/Zone</option>
                  <option value="bengaluru_koramangala">Bengaluru - Koramangala</option>
                  <option value="bengaluru_indiranagar">Bengaluru - Indiranagar</option>
                  <option value="mumbai_bandra">Mumbai - Bandra</option>
                  <option value="delhi_andheri">Delhi - South</option>
                </select>
                {form.formState.errors.zone && <p className="text-sm text-destructive">{form.formState.errors.zone.message}</p>}
              </div>
            </div>

            <Button type="submit" className="w-full mt-6" size="lg" isLoading={isLoading}>
              Create Account
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login" className="font-semibold text-primary hover:underline">Log in</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
