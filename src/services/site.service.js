import { resourceByKey } from "../config/resources.js";
import { listPublic } from "./content.service.js";
import { getSettings } from "./settings.service.js";

const byFooterOrder = (a, b) => (a.footer_order ?? 999) - (b.footer_order ?? 999);

const footerItems = (rows, labelField) =>
  rows
    .filter((row) => row.show_in_footer)
    .sort(byFooterOrder)
    .map((row) => ({ slug: row.slug, label: row[labelField] }));

/**
 * Everything the public website needs, in a single request.
 */
export const getSitePayload = async () => {
  const r = resourceByKey;
  const [
    settings,
    stats,
    values,
    services,
    solutions,
    customers,
    testimonials,
    team,
    socialLinks,
    chatQuickActions,
  ] = await Promise.all([
    getSettings(),
    listPublic(r.stats),
    listPublic(r.values),
    listPublic(r.services),
    listPublic(r.solutions),
    listPublic(r.customers),
    listPublic(r.testimonials),
    listPublic(r.team),
    listPublic(r.socialLinks),
    listPublic(r.chatQuickActions),
  ]);

  return {
    settings,
    stats,
    values,
    services,
    solutions,
    customers,
    testimonials,
    team,
    socialLinks,
    footer: {
      services: footerItems(services, "title"),
      solutions: footerItems(solutions, "name"),
    },
    chat: {
      botName: settings.chat_bot_name,
      welcomeMessage: settings.chat_welcome_message,
      quickActions: chatQuickActions,
    },
  };
};
