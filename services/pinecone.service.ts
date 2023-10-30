import { PineconeStore } from "langchain/vectorstores/pinecone";
import { Pinecone, CreateRequest, QueryOptions } from "@pinecone-database/pinecone";
import { Document } from "langchain/dist/document";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { DeleteOperationRequest, QueryOperationRequest } from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch";
import e from "express";

export class PineConeService {
    constructor() {
    }

    async saveData(docs: Document<Record<string, string>>[], classId: string): Promise<void> {
        const client = new Pinecone({
            apiKey: process.env.PINECONE_AI_API_KEY!,
            environment: process.env.PINECONE_ENVIRONMENT!
        });

        const index = client.Index(process.env.PINECONE_INDEX_NAME!);

        await PineconeStore.fromDocuments(docs, new OpenAIEmbeddings(), {
            pineconeIndex: index,
            namespace: classId
        });
    }

    async getVectorStore(classId: string) {
        const client = new Pinecone({
            apiKey: process.env.PINECONE_AI_API_KEY!,
            environment: process.env.PINECONE_ENVIRONMENT!
        });

        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY
        });

        const index = client.Index(process.env.PINECONE_INDEX_NAME!)
        const store = await PineconeStore.fromExistingIndex(
            new OpenAIEmbeddings(),
            {
                pineconeIndex: index,
                namespace: classId
            }
          );
          
        return store;
    }

    async queryIndex(classId: string, prompt: number[]) {
        const client = new Pinecone({
            apiKey: process.env.PINECONE_AI_API_KEY!,
            environment: process.env.PINECONE_ENVIRONMENT!
        });

        const queryRequest: QueryOptions = {
            topK: 5,
            includeValues: true,
            includeMetadata: true,
            vector: prompt
        };
        
        const response = await client.Index(process.env.PINECONE_INDEX_NAME!).namespace(classId).query(queryRequest);

        return response.matches;
    }
}