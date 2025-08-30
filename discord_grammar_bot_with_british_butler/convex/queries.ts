import { query } from "./_generated/server";
import { v } from "convex/values";

export const getBotSettings = query({
  args: { guildId: v.string() },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("botSettings")
      .withIndex("by_guild", (q) => q.eq("guildId", args.guildId))
      .unique();

    return settings || {
      guildId: args.guildId,
      enabled: true,
      ignoredChannels: [] as string[],
      ignoredUsers: [] as string[],
    };
  },
});

export const getCorrections = query({
  args: { 
    guildId: v.optional(v.string()),
    userId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.guildId) {
      return await ctx.db
        .query("corrections")
        .withIndex("by_guild", (q) => q.eq("guildId", args.guildId!))
        .order("desc")
        .take(args.limit || 50);
    } else if (args.userId) {
      return await ctx.db
        .query("corrections")
        .withIndex("by_user", (q) => q.eq("userId", args.userId!))
        .order("desc")
        .take(args.limit || 50);
    }

    return await ctx.db
      .query("corrections")
      .order("desc")
      .take(args.limit || 50);
  },
});

export const getCorrectionStats = query({
  args: { guildId: v.string() },
  handler: async (ctx, args) => {
    const corrections = await ctx.db
      .query("corrections")
      .withIndex("by_guild", (q) => q.eq("guildId", args.guildId))
      .collect();

    const userStats: Record<string, number> = {};
    corrections.forEach(correction => {
      userStats[correction.userId] = (userStats[correction.userId] || 0) + 1;
    });

    return {
      totalCorrections: corrections.length,
      userStats,
      recentCorrections: corrections
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10),
    };
  },
});
