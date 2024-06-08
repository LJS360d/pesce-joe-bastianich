import axios from 'axios';

class ChefService {
	public async getSuggestion(ingredients: string): Promise<string> {
		const res = await axios.post<string>('https://goblin.tools/api/Chef', {
			Text: ingredients,
		});
		return res.data;
	}
}

export default ChefService;
