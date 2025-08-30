import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export function BotDashboard() {
  const [selectedGuildId, setSelectedGuildId] = useState("123456789012345678"); // Example guild ID
  const [inviteUrl, setInviteUrl] = useState("");
  
  const botSettings = useQuery(api.queries.getBotSettings, { guildId: selectedGuildId });
  const corrections = useQuery(api.queries.getCorrections, { guildId: selectedGuildId, limit: 10 });
  const stats = useQuery(api.queries.getCorrectionStats, { guildId: selectedGuildId });

  useEffect(() => {
    // Fetch bot invite URL
    fetch('/discord/invite')
      .then(res => res.json())
      .then(data => setInviteUrl(data.inviteUrl))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-8">
      {/* Bot Setup Instructions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold mb-4">🤖 Bot Setup Instructions</h2>
        <div className="space-y-4 text-gray-700">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Step 1: Add Bot to Your Server</h3>
            <p className="text-sm mb-3">Click the button below to invite Reginald to your Discord server:</p>
            {inviteUrl ? (
              <a 
                href={inviteUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                🎩 Invite Reginald to Server
              </a>
            ) : (
              <p className="text-sm text-gray-500">Loading invite link...</p>
            )}
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Step 2: Bot Permissions</h3>
            <p className="text-sm mb-2">Reginald needs these permissions to function properly:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Read Messages/View Channels</li>
              <li>Send Messages</li>
              <li>Read Message History</li>
              <li>Use Slash Commands</li>
            </ul>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-2">Step 3: Available Commands</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><code>/reginald-status</code> - View correction statistics for your server</li>
              <li>Reginald automatically corrects grammar in messages (no command needed)</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">Environment Variables Needed</h3>
            <p className="text-sm mb-2">To complete the setup, you need to configure these environment variables:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><code>DISCORD_BOT_TOKEN</code> - Your Discord bot token</li>
              <li><code>DISCORD_CLIENT_ID</code> - Your Discord application client ID</li>
            </ul>
            <button 
              onClick={() => {
                // This would trigger the addEnvironmentVariables tool
                alert("Please add DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID to your environment variables in the Convex dashboard.");
              }}
              className="mt-2 bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
            >
              Configure Environment Variables
            </button>
          </div>
        </div>
      </div>

      {/* Bot Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-2">Total Corrections</h3>
          <p className="text-3xl font-bold text-blue-600">{stats?.totalCorrections || 0}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-2">Bot Status</h3>
          <p className="text-lg">
            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${botSettings?.enabled ? 'bg-green-500' : 'bg-red-500'}`}></span>
            {botSettings?.enabled ? 'Active' : 'Disabled'}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-2">Most Corrected User</h3>
          <p className="text-lg">
            {stats?.userStats && Object.keys(stats.userStats).length > 0 
              ? Object.entries(stats.userStats).sort(([,a], [,b]) => b - a)[0][0].slice(0, 8) + "..."
              : "None yet"
            }
          </p>
        </div>
      </div>

      {/* Recent Corrections */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold mb-4">📝 Recent Corrections</h2>
        {corrections && corrections.length > 0 ? (
          <div className="space-y-4">
            {corrections.map((correction) => (
              <div key={correction._id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="text-sm text-gray-500 mb-1">
                  User: {correction.userId.slice(0, 8)}... • {new Date(correction.timestamp).toLocaleString()}
                </div>
                <div className="mb-2">
                  <span className="text-red-600 font-medium">Original:</span>
                  <span className="ml-2 text-gray-700">"{correction.originalMessage}"</span>
                </div>
                <div>
                  <span className="text-green-600 font-medium">Reginald:</span>
                  <span className="ml-2 text-gray-700">"{correction.correctedMessage}"</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No corrections yet. Reginald is standing by, ready to assist with grammar! 🎩
          </p>
        )}
      </div>

      {/* Discord Bot Setup Guide */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold mb-4">🔧 Discord Developer Setup</h2>
        <p className="text-gray-600 mb-4">
          Follow these steps to create and configure your Discord bot:
        </p>
        
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-semibold mb-2">1. Create Discord Application</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>Go to <a href="https://discord.com/developers/applications" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Discord Developer Portal</a></li>
              <li>Click "New Application" and name it "Reginald Grammar Butler"</li>
              <li>Copy the "Application ID" (this is your CLIENT_ID)</li>
            </ol>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-semibold mb-2">2. Create Bot User</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>Go to "Bot" section in the left sidebar</li>
              <li>Click "Add Bot"</li>
              <li>Copy the bot token (this is your BOT_TOKEN)</li>
              <li>Enable "Message Content Intent" under "Privileged Gateway Intents"</li>
            </ol>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-semibold mb-2">3. Configure Slash Commands</h4>
            <p className="text-sm text-gray-700 mb-2">Set the interactions endpoint URL to:</p>
            <code className="bg-gray-100 px-2 py-1 rounded text-xs block mb-2">
              {window.location.origin}/discord/interactions
            </code>
            <p className="text-sm text-gray-700">This enables slash commands like <code>/reginald-status</code></p>
          </div>

          <div className="border-l-4 border-orange-500 pl-4">
            <h4 className="font-semibold mb-2">4. Set Environment Variables</h4>
            <p className="text-sm text-gray-700 mb-2">Add these to your Convex deployment:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li><code>DISCORD_BOT_TOKEN</code> - The bot token from step 2</li>
              <li><code>DISCORD_CLIENT_ID</code> - The application ID from step 1</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
