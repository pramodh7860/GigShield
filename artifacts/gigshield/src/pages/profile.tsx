import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from "@/components/ui";
import { useState } from "react";
import { useUpdateWorker } from "@/hooks/use-worker"; // Note: we'll create this minimal wrapper or just use query
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateWorker } from "@workspace/api-client-react";
import { getAuthHeaders } from "@/hooks/use-auth";

export function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    zone: user?.zone || "",
    platform: user?.platform || "",
  });

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => updateWorker(user!.id, data, { headers: getAuthHeaders() }),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["auth", "me"], updatedUser);
      toast({ title: "Profile updated successfully" });
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Update failed", description: err.message })
  });

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-display font-bold">Your Profile</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); mutation.mutate(formData); }}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Email (Read-only)</Label>
                <Input value={user.email} disabled />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>

            <div className="border-t pt-6 mt-6 space-y-4">
              <h3 className="font-semibold text-lg">Work Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Platform</Label>
                  <select className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2" value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})}>
                    <option value="zomato">Zomato</option>
                    <option value="swiggy">Swiggy</option>
                    <option value="ubereats">Uber Eats</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Active Zone</Label>
                  <Input value={formData.zone} onChange={e => setFormData({...formData, zone: e.target.value})} />
                </div>
              </div>
            </div>

            <Button type="submit" className="mt-4" isLoading={mutation.isPending}>Save Changes</Button>
          </form>
        </CardContent>
      </Card>
      
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-destructive">Account Status</h3>
            <p className="text-sm text-muted-foreground">Trust Score: {user.trustScore}/100</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
