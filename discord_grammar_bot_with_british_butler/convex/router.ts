import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

const http = httpRouter();

// Discord interactions endpoint (for slash commands, buttons, etc.)
http.route({
  path: "/discord/interactions",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const signature = request.headers.get("x-signature-ed25519");
      const timestamp = request.headers.get("x-signature-timestamp");
      const body = await request.text();

      // In production, you should verify the signature here
      // For now, we'll skip verification for development

      const interaction = JSON.parse(body);

      // Handle ping
      if (interaction.type === 1) {
        return new Response(JSON.stringify({ type: 1 }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle other interactions
      const response = await ctx.runAction(api.discord.handleDiscordInteraction, interaction);

      return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Discord interaction error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }),
});

// Webhook for Discord gateway events (messages, etc.)
http.route({
  path: "/discord/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      
      // Handle message events
      if (body.t === "MESSAGE_CREATE") {
        const message = body.d;
        
        // Ignore bot messages and commands
        if (message.author.bot || message.content.startsWith('/') || message.content.startsWith('!')) {
          return new Response("OK", { status: 200 });
        }

        // Check if bot is enabled for this guild
        const settings = await ctx.runQuery(api.queries.getBotSettings, {
          guildId: message.guild_id,
        });

        if (!settings.enabled || 
            (message.channel_id && settings.ignoredChannels && settings.ignoredChannels.includes(String(message.channel_id))) ||
            (message.author?.id && settings.ignoredUsers && settings.ignoredUsers.includes(String(message.author.id)))) {
          return new Response("OK", { status: 200 });
        }

        // Process the message for grammar correction
        const correction = await ctx.runAction(api.discord.correctGrammar, {
          message: message.content,
          userId: message.author.id,
          channelId: message.channel_id,
          guildId: message.guild_id,
          messageId: message.id,
        });

        // Send correction if needed
        if (correction) {
          await ctx.runAction(api.discord.sendDiscordMessage, {
            channelId: message.channel_id,
            content: correction,
            replyToMessageId: message.id,
          });
        }

        return new Response("OK", { status: 200 });
      }

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Discord webhook error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }),
});

// Endpoint to get bot statistics
http.route({
  path: "/discord/stats/:guildId",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const guildId = url.pathname.split("/").pop();
    
    if (!guildId) {
      return new Response("Guild ID required", { status: 400 });
    }

    const stats = await ctx.runQuery(api.queries.getCorrectionStats, {
      guildId,
    });

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Bot invite endpoint
http.route({
  path: "/discord/invite",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId) {
      return new Response("Bot not configured", { status: 500 });
    }

    const permissions = "2048"; // Send Messages permission
    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot%20applications.commands`;

    return new Response(JSON.stringify({ inviteUrl }), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
