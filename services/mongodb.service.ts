import { MongoDBAtlasVectorSearch } from "langchain/vectorstores/mongodb_atlas";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { MongoClient } from "mongodb";
import { Document } from "langchain/dist/document";

export class MongDBService {
    constructor(private readonly client: MongoClient) {

    }

    async queryIndex(classId: string, prompt: string, useFilter: boolean = false): Promise<unknown> {
        const namespace = "vector-database.text-vector-data";
        const [dbName, collectionName] = namespace.split(".");
        const collection = this.client.db(dbName).collection(collectionName);
        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY
        });

        console.log("open api key: ", process.env.OPENAI_API_KEY);

        const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
            collection,
            indexName: "embeddings-search", // The name of the Atlas search index. Defaults to "default"
            textKey: "text", // The name of the collection field containing the raw content. Defaults to "text"
            embeddingKey: "embedding", // The name of the collection field containing the embedded text. Defaults to "embedding"
        });

        console.log("classId: ", classId);

        const filter = useFilter ? {
            preFilter: {
                text: {
                    path: "classId",
                    query: classId
                }
            }
        } : undefined;

        console.log("filter: ", filter);

        const resultOne = await vectorStore.similaritySearch(prompt, 5, filter);
        console.log(resultOne);

        return resultOne;
    }

    

    getVectorStore(): MongoDBAtlasVectorSearch {
        const namespace = "vector-database.text-vector-data";
        const [dbName, collectionName] = namespace.split(".");
        const collection = this.client.db(dbName).collection(collectionName);
        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY
        });

        const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
            collection,
            indexName: "embeddings-search", // The name of the Atlas search index. Defaults to "default"
            textKey: "text", // The name of the collection field containing the raw content. Defaults to "text"
            embeddingKey: "embedding", // The name of the collection field containing the embedded text. Defaults to "embedding"
        });

        return vectorStore;
    }

    async saveData(docs: Document<Record<string, string>>[], indexId: string): Promise<void> {
        console.log("Save data entered: ");
        const namespace = "vector-database.text-vector-data";
        const [dbName, collectionName] = namespace.split(".");
        const collection = this.client.db(dbName).collection(collectionName);
        console.log("collection name: ", collection.collectionName);
        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY
        });

        docs.map(doc => {
            doc.metadata["classId"] = indexId
        });

        const blah = await MongoDBAtlasVectorSearch.fromDocuments(
            docs,
            embeddings,
            {
                collection,
                indexName: "embeddings-search", // The name of the Atlas search index. Defaults to "default"
                textKey: "text", // The name of the collection field containing the raw content. Defaults to "text"
                embeddingKey: "embedding", // The name of the collection field containing the embedded text. Defaults to "embedding"
            }
        );

        console.log("finished inserting: ", blah);
    }
    
}