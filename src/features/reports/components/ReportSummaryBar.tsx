'use client';

import { Car, ScanFace, Users } from 'lucide-react';

import type { EnrollmentSummary } from '@/features/reports/types';
import { ENROLLMENT_GROUP_LABEL } from '@/features/reports/types';
import { cn } from '@/lib/utils';

type ReportSummaryBarProps = {
  summary: EnrollmentSummary | undefined;
  loading: boolean;
};

function formatCount(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function StatPill({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint?: string;
  tone?: 'neutral' | 'success' | 'warning';
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-2.5 rounded-lg border bg-card px-3 py-2',
        tone === 'success' && 'border-emerald-200 bg-emerald-50/70',
        tone === 'warning' && 'border-amber-200 bg-amber-50/70',
      )}
    >
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-md text-white',
          tone === 'success' && 'bg-emerald-600',
          tone === 'warning' && 'bg-amber-600',
          tone === 'neutral' && 'bg-sky-600',
        )}
      >
        <Icon className="size-4" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground truncate text-xs font-medium">
          {label}
        </p>
        <p className="truncate text-sm font-semibold tabular-nums">
          {value}
          {hint ? (
            <span className="text-muted-foreground ml-1.5 font-normal">
              {hint}
            </span>
          ) : null}
        </p>
      </div>
    </div>
  );
}

export function ReportSummaryBar({ summary, loading }: ReportSummaryBarProps) {
  if (loading && !summary) {
    return (
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="bg-muted h-14 animate-pulse rounded-lg" />
        <div className="bg-muted h-14 animate-pulse rounded-lg" />
        <div className="bg-muted h-14 animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!summary) return null;

  const groupLabel = ENROLLMENT_GROUP_LABEL[summary.group];
  const showVehicle = summary.withVehicle !== undefined;
  const percentWithoutFace =
    summary.total > 0
      ? Math.round((summary.withoutFace / summary.total) * 100)
      : 0;

  return (
    <div className={cn('grid gap-2', showVehicle ? 'sm:grid-cols-4' : 'sm:grid-cols-3')}>
      <StatPill
        icon={Users}
        label={groupLabel}
        value={formatCount(summary.total)}
        hint="no filtro atual"
      />
      <StatPill
        icon={ScanFace}
        label="Com face"
        value={`${formatCount(summary.withFace)} (${summary.percentWithFace}%)`}
        tone="success"
      />
      <StatPill
        icon={ScanFace}
        label="Sem face"
        value={`${formatCount(summary.withoutFace)} (${percentWithoutFace}%)`}
        tone="warning"
      />
      {showVehicle ? (
        <StatPill
          icon={Car}
          label="Com veículo"
          value={`${formatCount(summary.withVehicle ?? 0)} (${summary.percentWithVehicle ?? 0}%)`}
          tone="success"
        />
      ) : null}
    </div>
  );
}
