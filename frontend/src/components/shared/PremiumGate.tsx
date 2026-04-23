import Card from "../ui/Card.tsx";
import Button from "../ui/Button.tsx";

interface PremiumGateProps {
  feature?: string;
}

export default function PremiumGate({ feature = "cette fonctionnalité" }: PremiumGateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-sm text-center">
        <div className="text-4xl mb-4">⭐</div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">Fonctionnalité Premium</h2>
        <p className="text-sm text-text-secondary mb-5">
          {feature} est réservée aux abonnés Premium. Passez au plan Premium pour y accéder.
        </p>
        <Button className="w-full">Passer à Premium — 99 MAD/mois</Button>
        <p className="text-xs text-text-tertiary mt-3">Essai gratuit 30 jours · Annulable à tout moment</p>
      </Card>
    </div>
  );
}
