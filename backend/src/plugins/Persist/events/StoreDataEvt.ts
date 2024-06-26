import { PersistedData } from "../../../data/entities/PersistedData.js";
import { persistEvt } from "../types.js";

export const StoreDataEvt = persistEvt({
  event: "guildMemberRemove",

  async listener({ pluginData, args: { member } }) {
    const config = await pluginData.config.getForUser(member.user);
    const persistData: Partial<PersistedData> = {};

    // FIXME: New caching thing, or fix deadlocks with this plugin
    if (member.partial) {
      return;
      // Djs hasn't cached member data => use db cache
      /*
      const data = await pluginData.getPlugin(GuildMemberCachePlugin).getCachedMemberData(member.id);
      if (!data) {
        return;
      }

      const rolesToPersist = config.persisted_roles.filter((roleId) => data.roles.includes(roleId));
      if (rolesToPersist.length) {
        persistData.roles = rolesToPersist;
      }
      if (config.persist_nicknames && data.nickname) {
        persistData.nickname = data.nickname;
      }*/
    } else {
      // Djs has cached member data => use that
      const memberRoles = Array.from(member.roles.cache.keys());
      const rolesToPersist = config.persisted_roles.filter((roleId) => memberRoles.includes(roleId));
      if (rolesToPersist.length) {
        persistData.roles = rolesToPersist;
      }
      if (config.persist_nicknames && member.nickname) {
        persistData.nickname = member.nickname as any;
      }
    }

    if (Object.keys(persistData).length) {
      pluginData.state.persistedData.set(member.id, persistData);
    }
  },
});
