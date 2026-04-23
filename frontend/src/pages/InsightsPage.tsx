import { useInsights } from "../hooks/useDashboard.ts";
import { useAuthStore } from "../store/auth.ts";
import PremiumGate from "../components/shared/PremiumGate.tsx";
import Card, { CardHeader } from "../components/ui/Card.tsx";
import FinancialHealthScore from "../components/dashboard/FinancialHealthScore.tsx";
import { formatCurrency } from "../lib/utils.ts";
import Spinner from "../components/ui/Spinner.tsx";

export default function InsightsPage() {
  const { user } = useAuthStore();
  const { data, isLoading, error } = useInsights();

  if (user?.planType !== "premium") {
    return <div className="p-6"><PremiumGate feature="les Insights financiers" /></div>;
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>;

  const d = data as any;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Insights financiers</h1>
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">★ Premium actif</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Score santé */}
        {d?.insight && (
          <FinancialHealthScore score={d.insight.score} tips={d.insight.tips ?? []} />
        )}

        {/* Anomalies */}
        <Card className="xl:col-span-2">
          <CardHeader title="Alertes & Anomalies" />
          {d?.anomalies?.length === 0 ? (
            <p className="text-sm text-text-secondary py-4 text-center">✓ Aucune anomalie détectée ce mois-ci</p>
          ) : (
            <ul className="space-y-3">
              {d?.anomalies?.map((a: any, i: number) => (
                <li key={i} className="flex items-start gap-3 p-3 bg-danger-light rounded-sm">
                  <span className="text-danger text-lg">⚠</span>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{a.categoryName}</p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {formatCurrency(a.spent)} ce mois vs {formatCurrency(a.avgMonthly)} en moyenne ({a.ratio}×)
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Abonnements */}
        <Card className="xl:col-span-3">
          <CardHeader title="Abonnements détectés" />
          {d?.subscriptions?.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-4">Aucun abonnement récurrent détecté</p>
          ) : (
            <div className="divide-y divide-surface-border">
              {d?.subscriptions?.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{s.title}</p>
                    <p className="text-xs text-text-tertiary capitalize">{s.frequency}</p>
                  </div>
                  <p className="text-sm font-mono text-danger">{formatCurrency(s.amount)}/mois</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
