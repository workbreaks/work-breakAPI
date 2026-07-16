import { Injectable, InternalServerErrorException } from "@nestjs/common";
import {
  SYSTEM_PROMPT,
  DETAILED_FEATURE_DESCRIPTIONS,
  ACTION_KEYWORDS,
  INTENT_EXCLUSION_KEYWORDS,
} from "./assitant-constants";

@Injectable()
export class AssistantRepository {
  async ask(message: string): Promise<any> {
    let currentSystemPrompt = SYSTEM_PROMPT; // Start with the base system prompt
    const lowerCaseMessage = message.toLowerCase();

    let isCreationCommand = false;

    // --- 1. Detect if it's a Creation Command ---
    // Iterate through creation keywords to see if the user's message implies creation
    for (const keyword of ACTION_KEYWORDS) {
      if (lowerCaseMessage.includes(keyword)) {
        // Before marking as creation, check if it's negated by exclusion keywords
        const hasExclusion = INTENT_EXCLUSION_KEYWORDS.some((excl) =>
          lowerCaseMessage.includes(excl),
        );
        if (!hasExclusion) {
          isCreationCommand = true;
        }
        break;
      }
    }

    if (!isCreationCommand) {
      const matched = Object.keys(DETAILED_FEATURE_DESCRIPTIONS).find(key =>
        lowerCaseMessage.includes(key)
      );

      if (matched) {
        return {
          action: "info",
          topic: matched,
          description: DETAILED_FEATURE_DESCRIPTIONS[matched],
        };
      }

      // General info fallback
      return {
        action: "info",
        topic: "general",
        description:
          "Work Break helps you manage breaks, tasks, meetings, and leaves efficiently.",
      };
    }
    
    // --- 3. Date and Time Injection for Defaults ---
    // This logic runs regardless of intent, ensuring defaults are always current.
    const now = new Date();
    const today = now.toISOString().split("T")[0]; // YYYY-MM-DD (e.g., "2025-07-27")

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD (e.g., "2025-07-28")

    // ISO-8601 string for current local time (PKT, UTC+5)
    const pad = (num: number) => String(num).padStart(2, "0");
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();
    // Using current local time parts directly for the ISO-8601 string with offset.
    // This assumes your server's environment correctly reflects PKT or you are applying
    // a fixed +05:00 offset as specified in your prompt examples.
    const startTimeISOWithOffset = `${today}T${pad(currentHour)}:${pad(currentMinute)}:${pad(currentSecond)}+05:00`;

    currentSystemPrompt = currentSystemPrompt
      .replace(/'YYYY-MM-DD'/g, `'${today}'`)
      .replace(/today \/\/ \d{4}-\d{2}-\d{2}/g, `today // ${today}`)
      .replace(/'ISO-8601 string'/g, `'${startTimeISOWithOffset}'`)
      .replace(/current local time in ISO-8601/g, `'${startTimeISOWithOffset}'`)
      .replace(
        /tomorrow \/\/ \d{4}-\d{2}-\d{2}/g,
        `tomorrow // ${tomorrowDate}`,
      );

    const messages = [
      {
        role: "system",
        content: currentSystemPrompt,
      },
      {
        role: "user",
        content: message,
      },
    ];

    try {
      const res = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "Qwen/Qwen3.5-9B",
          temperature: 0.2,
          top_p: 0.9,
          repetition_penalty: 1.1,
          max_tokens: 400,
          messages,
        }),
      });


      if (!res.ok) {
        let errorMsg = `AI API failed with status ${res.status}`;
        try {
          const errorData = await res.json();
          errorMsg = errorData?.error?.message || errorMsg;
          console.error("AI API error details:", errorData);
        } catch (_) {
          // response was not JSON, ignore
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();

      const content = data?.choices?.[0]?.message?.content?.trim();
      if (!content) {
        console.error("AI API response malformed or empty:", data);
        throw new Error("AI response malformed or empty.");
      }

      // ---------- CLEANING ----------
      const stopSequence = "<</SYS>";
      const preCleaned = content.endsWith(stopSequence)
        ? content.slice(0, -stopSequence.length).trim()
        : content;

      const cleaned = preCleaned
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .replace(/JSONData:/gi, "")
        .replace(/JSON:/gi, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      // ---------- EXTRACT ACTIONS ----------
      const jsonMatches = [...cleaned.matchAll(/\{[\s\S]*?\}/g)];
      const actions = jsonMatches
        .map((m) => {
          try {
            return JSON.parse(m[0]);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      const cutIndex = cleaned.search(/[\{\[]/);

      let summary = cutIndex !== -1 ? cleaned.slice(0, cutIndex) : cleaned;

      summary = summary.replace(/^Summary:/i, "").trim();

      return {
        data: {
          summary: summary || "",
          actions: actions || [],
        },
      };
    } catch (error) {
      console.error("Failed to get AI response:", error.message || error);
      throw new InternalServerErrorException(
        "AI service temporarily unavailable.",
      );
    }
  }
}
