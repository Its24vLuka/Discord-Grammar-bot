import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const insertCorrection = mutation({
  args: {
    originalMessage: v.string(),
    correctedMessage: v.string(),
    userId: v.string(),
    channelId: v.string(),
    guildId: v.string(),
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("corrections", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const updateBotSettings = mutation({
  args: {
    guildId: v.string(),
    enabled: v.optional(v.boolean()),
    ignoredChannels: v.optional(v.array(v.string())),
    ignoredUsers: v.optional(v.array(v.string())),
    correctionThreshold: v.optional(v.number()),
    replyMode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("botSettings")
      .withIndex("by_guild", (q) => q.eq("guildId", args.guildId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...(args.enabled !== undefined && { enabled: args.enabled }),
        ...(args.ignoredChannels && { ignoredChannels: args.ignoredChannels }),
        ...(args.ignoredUsers && { ignoredUsers: args.ignoredUsers }),
        ...(args.correctionThreshold !== undefined && { correctionThreshold: args.correctionThreshold }),
        ...(args.replyMode && { replyMode: args.replyMode }),
      });
    } else {
      await ctx.db.insert("botSettings", {
        guildId: args.guildId,
        enabled: args.enabled ?? true,
        ignoredChannels: args.ignoredChannels ?? [],
        ignoredUsers: args.ignoredUsers ?? [],
        correctionThreshold: args.correctionThreshold ?? 0.7,
        replyMode: args.replyMode ?? "reply",
      });
    }
  },
});
