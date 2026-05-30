import { json, type RequestHandler } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';

export const GET: RequestHandler = async () => {
	return json({
		discord: !!privateEnv.DISCORD_CLIENT_ID,
		google: !!privateEnv.GOOGLE_CLIENT_ID
	});
};
