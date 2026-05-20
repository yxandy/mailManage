import type { HeroSmsOfferView, HeroSmsPriceMonitorRecord } from "./types";
import { getHeroSmsOffer } from "./client";
import {
  listActiveHeroSmsPriceMonitors,
  markHeroSmsPriceMonitorChecked,
  markHeroSmsPriceMonitorCheckFailed,
  markHeroSmsPriceMonitorTriggered,
} from "./repository";
import { checkHeroSmsPriceMonitorMatch } from "./price-monitor-rules";
import { createHeroSmsPriceMonitorNotification } from "@/lib/notifications/hero-sms";

export type HeroSmsPriceMonitorCheckResult = {
  checked: number;
  triggered: number;
  failed: number;
};

function groupHeroSmsPriceMonitors(
  monitors: HeroSmsPriceMonitorRecord[],
): Map<string, HeroSmsPriceMonitorRecord[]> {
  const groups = new Map<string, HeroSmsPriceMonitorRecord[]>();

  for (const monitor of monitors) {
    const key = `${monitor.service_code}:${monitor.country_id}`;
    const current = groups.get(key) ?? [];

    current.push(monitor);
    groups.set(key, current);
  }

  return groups;
}

export async function checkActiveHeroSmsPriceMonitors(): Promise<HeroSmsPriceMonitorCheckResult> {
  const monitors = await listActiveHeroSmsPriceMonitors();
  const groups = groupHeroSmsPriceMonitors(monitors);
  const result: HeroSmsPriceMonitorCheckResult = {
    checked: 0,
    triggered: 0,
    failed: 0,
  };

  for (const group of groups.values()) {
    const firstMonitor = group[0];

    if (!firstMonitor) {
      continue;
    }

    let offer: HeroSmsOfferView | null = null;

    try {
      offer = await getHeroSmsOffer(firstMonitor.service_code, firstMonitor.country_id);
    } catch (error) {
      const checkedAt = new Date().toISOString();
      const errorMessage = error instanceof Error ? error.message : "查询 HeroSMS 报价失败";

      await Promise.all(
        group.map((monitor) =>
          markHeroSmsPriceMonitorCheckFailed({
            id: monitor.id,
            checkedAt,
            errorMessage,
          }),
        ),
      );
      result.failed += group.length;
      continue;
    }

    for (const monitor of group) {
      const checkedAt = new Date().toISOString();

      try {
        const match = checkHeroSmsPriceMonitorMatch({
          offer,
          operatorCode: monitor.operator_code,
          targetPrice: monitor.target_price,
        });

        result.checked += 1;

        if (!match.matched) {
          await markHeroSmsPriceMonitorChecked({
            id: monitor.id,
            checkedAt,
            availableCount: match.availableCount,
          });
          continue;
        }

        await createHeroSmsPriceMonitorNotification({
          monitor,
          availableCount: match.availableCount,
          checkedAt,
        });
        await markHeroSmsPriceMonitorTriggered({
          id: monitor.id,
          checkedAt,
          availableCount: match.availableCount,
        });
        result.triggered += 1;
      } catch (error) {
        result.failed += 1;
        await markHeroSmsPriceMonitorCheckFailed({
          id: monitor.id,
          checkedAt,
          errorMessage: error instanceof Error ? error.message : "检查 HeroSMS 价格监控失败",
        });
      }
    }
  }

  return result;
}
