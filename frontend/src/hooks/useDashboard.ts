import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.ts";

export function useDashboard(month?: string) {
  const qs = month ? `?month=${month}` : "";
  return useQuery({
    queryKey: ["dashboard", month ?? "current"],
    queryFn: () => api.get(`/dashboard${qs}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: () => api.get<Account[]>("/accounts"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<Category[]>("/categories"),
    staleTime: 60 * 60 * 1000, // 1h — peu volatiles
  });
}

export function useTransactions(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: () => api.get<Transaction[]>(`/transactions${qs ? `?${qs}` : ""}`),
  });
}

export function useBudgets(month?: string) {
  const qs = month ? `?month=${month}` : "";
  return useQuery({
    queryKey: ["budgets", month ?? "current"],
    queryFn: () => api.get<Budget[]>(`/budgets${qs}`),
  });
}

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: () => api.get<Goal[]>("/goals"),
  });
}

export function useDebts() {
  return useQuery({
    queryKey: ["debts"],
    queryFn: () => api.get<Debt[]>("/debts"),
  });
}

export function useInsights() {
  return useQuery({
    queryKey: ["insights"],
    queryFn: () => api.get("/insights"),
    retry: false, // ne pas retenter si 403 (plan free)
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post("/transactions", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/transactions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post("/budgets", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post("/goals", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useContributeToGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      api.post(`/goals/${id}/contribute`, { amount }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

// Types locaux (mirroir des types API)
export interface Account {
  id: string; name: string; type: string; currency: string;
  color: string; icon: string; balance: number; isArchived: boolean;
}
export interface Category {
  id: string; name: string; type: "income" | "expense";
  icon: string; color: string; isDefault: boolean;
}
export interface Transaction {
  id: string; title: string; amount: number; type: string;
  date: string; categoryId: string; accountId: string;
  note?: string; fiscalMarker: boolean; isRecurring: boolean;
  transferId?: string;
}
export interface Budget {
  id: string; categoryId: string; categoryName: string;
  categoryIcon: string; categoryColor: string;
  amount: number; spent: number; remaining: number;
  pct: number; alertLevel: "ok" | "predictive" | "warning" | "exceeded";
}
export interface Goal {
  id: string; name: string; description?: string;
  targetAmount: number; currentAmount: number; currency: string;
  targetDate?: string; status: string; emoji: string;
  pct: number; remaining: number; projectedCompletionDate?: string;
}
export interface Debt {
  id: string; creditor: string; totalAmount: number;
  remainingAmount: number; monthlyPayment: number;
  interestRate: string; currency: string; startDate: string;
}
