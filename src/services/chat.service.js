import { resourceByKey } from "../config/resources.js";
import { listPublic } from "./content.service.js";
import { getSettings } from "./settings.service.js";

/**
 * Same behaviour as the original ChatWidget: FAQs are checked in priority
 * order and the first one with a keyword contained in the message wins.
 */
export const getReply = async (message) => {
  const lower = message.toLowerCase();
  const faqs = await listPublic(resourceByKey.chatFaqs);

  const match = faqs.find((faq) => faq.keywords.some((kw) => lower.includes(kw.toLowerCase())));
  if (match) return { reply: match.response, matched: match.slug };

  const settings = await getSettings();
  return { reply: settings.chat_default_response, matched: null };
};

export const getChatConfig = async () => {
  const [settings, quickActions] = await Promise.all([
    getSettings(),
    listPublic(resourceByKey.chatQuickActions),
  ]);
  return {
    botName: settings.chat_bot_name,
    welcomeMessage: settings.chat_welcome_message,
    quickActions,
  };
};
