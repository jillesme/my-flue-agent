import { invoke } from '@flue/runtime';
import refreshWatchtower from './workflows/refresh-watchtower';
import { isWorldCupWeekday } from './watchtower';

type ScheduledController = {
  scheduledTime: number;
};

export default {
  async scheduled(controller: ScheduledController) {
    const scheduledAt = new Date(controller.scheduledTime);

    // Cloudflare cron schedules are UTC. Keep the trigger simple and apply the
    // public editorial window in US Eastern time, including daylight saving time.
    if (!isWorldCupWeekday(scheduledAt)) return;

    await invoke(refreshWatchtower, {
      input: { scheduledAt: scheduledAt.toISOString() },
    });
  },
};
