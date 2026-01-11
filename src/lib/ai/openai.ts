import OpenAI from "openai";
import { config } from "@/lib/config";

export const openai =
  config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey }) : null;
