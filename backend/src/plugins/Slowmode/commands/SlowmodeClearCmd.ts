import { ChannelType, escapeInlineCode } from "discord.js";
import { commandTypeHelpers as ct } from "../../../commandTypes.js";
import { sendErrorMessage, sendSuccessMessage } from "../../../pluginUtils.js";
import { asSingleLine, renderUsername } from "../../../utils.js";
import { getMissingChannelPermissions } from "../../../utils/getMissingChannelPermissions.js";
import { missingPermissionError } from "../../../utils/missingPermissionError.js";
import { BOT_SLOWMODE_CLEAR_PERMISSIONS } from "../requiredPermissions.js";
import { slowmodeCmd } from "../types.js";
import { clearBotSlowmodeFromUserId } from "../util/clearBotSlowmodeFromUserId.js";

export const SlowmodeClearCmd = slowmodeCmd({
  trigger: ["slowmode clear", "slowmode c"],
  permission: "can_manage",

  signature: {
    channel: ct.textChannel(),
    user: ct.resolvedUserLoose(),

    force: ct.bool({ option: true, isSwitch: true }),
  },

  async run({ message: msg, args, pluginData }) {
    const channelSlowmode = await pluginData.state.slowmodes.getChannelSlowmode(args.channel.id);
    if (!channelSlowmode) {
      sendErrorMessage(pluginData, msg.channel, "Channel doesn't have slowmode!");
      return;
    }

    const me = pluginData.guild.members.cache.get(pluginData.client.user!.id)!;
    const missingPermissions = getMissingChannelPermissions(me, args.channel, BOT_SLOWMODE_CLEAR_PERMISSIONS);
    if (missingPermissions) {
      sendErrorMessage(
        pluginData,
        msg.channel,
        `Unable to clear slowmode. ${missingPermissionError(missingPermissions)}`,
      );
      return;
    }

    try {
      if (args.channel.type === ChannelType.GuildText) {
        await clearBotSlowmodeFromUserId(pluginData, args.channel, args.user.id, args.force);
      } else {
        sendErrorMessage(
          pluginData,
          msg.channel,
          asSingleLine(`
            Failed to clear slowmode from **${renderUsername(args.user)}** in <#${args.channel.id}>:
            Threads cannot have Bot Slowmode
          `),
        );
        return;
      }
    } catch (e) {
      sendErrorMessage(
        pluginData,
        msg.channel,
        asSingleLine(`
          Failed to clear slowmode from **${renderUsername(args.user)}** in <#${args.channel.id}>:
          \`${escapeInlineCode(e.message)}\`
        `),
      );
      return;
    }

    sendSuccessMessage(
      pluginData,
      msg.channel,
      `Slowmode cleared from **${renderUsername(args.user)}** in <#${args.channel.id}>`,
    );
  },
});
