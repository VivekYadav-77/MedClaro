import en from "@/messages/en.json";
import hi from "@/messages/hi.json";
import ta from "@/messages/ta.json";
import bn from "@/messages/bn.json";
import te from "@/messages/te.json";
import mr from "@/messages/mr.json";
import { LanguageCode } from "@/lib/types";

const messages = { en, hi, ta, bn, te, mr };

export function getMessages(locale: LanguageCode) {
  return messages[locale] ?? messages.en;
}
