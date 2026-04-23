import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formate des centimes en devise affichable : 32000 → "320,00 MAD" */
export function formatCurrency(cents: number, currency = "MAD"): string {
  return new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100) + ` ${currency}`;
}

/** Formate une date ISO en date française : "2026-04-23" → "23 avril 2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Retourne "Aujourd'hui", "Hier" ou la date courte */
export function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

/** Calcule un pourcentage arrondi à 1 décimale */
export function pct(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 1000) / 10;
}

/** Initiales à partir d'un nom complet : "Karim Alaoui" → "KA" */
export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Retourne le premier jour du mois courant au format "YYYY-MM" */
export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Signe arithmétique pour affichage : +500 MAD / -320 MAD */
export function signedAmount(cents: number, type: string, currency = "MAD"): string {
  const abs = formatCurrency(Math.abs(cents), currency);
  return type === "income" || cents > 0 ? `+${abs}` : `-${abs}`;
}
