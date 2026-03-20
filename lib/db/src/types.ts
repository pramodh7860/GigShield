export interface WorkerDocument {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  phone: string | null;
  zone: string;
  platform: string;
  trustScore: number;
  riskScore: number;
  isActive: boolean;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyDocument {
  id: number;
  workerId: number;
  planId: string;
  planName: string;
  status: string;
  weeklyPremium: number;
  maxPayoutPerWeek: number;
  zone: string;
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
}

export interface TriggerDocument {
  id: number;
  type: string;
  zone: string;
  description: string;
  severity: string;
  rainfallMm: number | null;
  temperatureCelsius: number | null;
  orderDropPercent: number | null;
  affectedWorkers: number;
  totalPayout: number;
  createdAt: Date;
}

export interface ClaimDocument {
  id: number;
  workerId: number;
  policyId: number;
  triggerId: number;
  amount: number;
  status: string;
  triggerType: string;
  triggerDescription: string;
  zone: string;
  fraudScore: number;
  notes: string | null;
  createdAt: Date;
  paidAt: Date | null;
}
