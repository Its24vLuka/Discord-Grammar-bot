"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.CONVEX_OPENAI_BASE_URL,
  apiKey: process.env.CONVEX_OPENAI_API_KEY,
});

export const correctGrammar = action({
  args: {
    message: v.string(),
    userId: v.string(),
    channelId: v.string(),
    guildId: v.string(),
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1-nano",
        messages: [
          {
            role: "system",
            content: `You are Reginald, a distinguished British butler with impeccable grammar and manners. Your task is to politely correct grammatical errors in messages while maintaining your refined, courteous demeanor.

Rules:
1. If the message has NO grammatical errors, respond with: "PERFECT_GRAMMAR"
2. If there ARE grammatical errors, provide the corrected version preceded by a polite British butler comment
3. Always be respectful and encouraging
4. Use British spellings (colour, realise, etc.)
5. Address the person courteously
6. Keep corrections concise but helpful

Examples:
- Input: "i dont no what to do"
- Output: "I beg your pardon, but might I suggest: 'I don't know what to do.' Quite understandable, really!"

- Input: "The weather is nice today."
- Output: "PERFECT_GRAMMAR"`
          },
          {
            role: "user",
            content: args.message
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      const correction = response.choices[0].message.content?.trim() || "";
      
      // If grammar is perfect, don't store or return anything
      if (correction === "PERFECT_GRAMMAR") {
        return null;
      }

      // Store the correction in the database
      await ctx.runMutation(api.mutations.insertCorrection, {
        originalMessage: args.message,
        correctedMessage: correction,
        userId: args.userId,
        channelId: args.channelId,
        guildId: args.guildId,
        messageId: args.messageId,
      });

      return correction;
    } catch (error) {
      console.error("Error correcting grammar:", error);
      return "I do apologise, but I seem to be having a spot of trouble with my grammar correction services at the moment. Frightfully sorry!";
    }
  },
});

export const sendDiscordMessage = action({
  args: {
    channelId: v.string(),
    content: v.string(),
    replyToMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      throw new Error("Discord bot token not configured");
    }

    try {
      const payload: any = {
        content: args.content,
      };

      if (args.replyToMessageId) {
        payload.message_reference = {
          message_id: args.replyToMessageId,
        };
      }

      const response = await fetch(`https://discord.com/api/v10/channels/${args.channelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Discord API error:', error);
        throw new Error(`Discord API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error sending Discord message:", error);
      throw error;
    }
  },
});

export const handleDiscordInteraction = action({
  args: {
    type: v.number(),
    data: v.optional(v.any()),
    guild_id: v.optional(v.string()),
    channel_id: v.optional(v.string()),
    member: v.optional(v.any()),
    user: v.optional(v.any()),
  },
  handler: async (ctx, args): Promise<any> => {
    // Handle slash commands and other interactions
    if (args.type === 2) { // APPLICATION_COMMAND
      const commandName = args.data?.name;
      
      if (commandName === "reginald-status") {
        const guildId = args.guild_id;
        if (!guildId) {
          return {
            type: 4,
            data: {
              content: "This command can only be used in a server!",
              flags: 64, // EPHEMERAL
            },
          };
        }

        const stats: any = await ctx.runQuery(api.queries.getCorrectionStats, { guildId });
        
        return {
          type: 4,
          data: {
            content: `🎩 **Reginald's Status Report**\n\n` +
                    `📊 Total corrections made: **${stats.totalCorrections}**\n` +
                    `🏆 Most corrected users: ${Object.entries(stats.userStats || {})
                      .sort(([,a], [,b]) => (b as number) - (a as number))
                      .slice(0, 3)
                      .map(([userId, count]) => `<@${userId}> (${count})`)
                      .join(', ') || 'None yet'}\n\n` +
                    `*At your service, as always! 🎩*`,
            flags: 64, // EPHEMERAL
          },
        };
      }
    }

    return {
      type: 1, // PONG
    };
  },
});
