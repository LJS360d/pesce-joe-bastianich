import {
	Collection,
	type GuildMember,
	type ChatInputCommandInteraction,
	type Message,
	type Role,
	type User,
} from 'discord.js';
import env from '../env';

export function mentionsUser(message: Message, user: User) {
	const { guild, mentions } = message;
	const botRoles =
		guild?.members.cache.find((m) => m.id === user.id)?.roles.cache ??
		new Collection<string, Role>();
	return (
		message.mentions.users.has(user.id) ||
		mentions.roles.some((role) => botRoles.hasAny(role.id))
	);
}

export async function ensureAdminInteraction(
	interaction: ChatInputCommandInteraction<'cached'>,
	msg?: string
) {
	const admin = isAdmin(interaction.member);
	if (!admin) {
		void interaction.reply({
			content: msg ?? 'You are not authorized to use this command.',
			ephemeral: true,
		});
	}
	return admin;
}

export async function isAdmin(user: GuildMember) {
	if (env.OWNER_IDS.includes(user.id)) {
		return true;
	}
	const perms = user.permissions;
	if (perms.has('Administrator')) {
		return true;
	}
	return false;
}
