import axios from 'axios';

export class OpenAIService {
    async getEmbeddings(prompt: string) : Promise<number[]> {
        const embeddingsURL = "https://api.openai.com/v1/embeddings";
        const apiKey = process.env.OPENAI_API_KEY;
        const headers = {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        };

        const body = {
            input: prompt,
            model: "text-embedding-ada-002"
        };

        const result = await axios.post(embeddingsURL, body, {
            headers: headers
        });

        console.log("result: ", result);
        console.log("data: ", result.data.data[0]);
        return result.data?.data?.[0].embedding;
    }
}