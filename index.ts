import express, { Application, Router } from "express";
import * as dotenv from "dotenv";
import { unlinkSync } from "fs";
import multer from "multer";
import { PDFLoader  } from 'langchain/document_loaders/fs/pdf';
import { RetrievalQAChain } from "langchain/chains"
import {
  SageMakerEndpoint
} from "langchain/llms/sagemaker_endpoint";
import { MongoClient } from "mongodb";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PineConeService } from "./services/pinecone.service";
import { OpenAIService } from "./services/openai.service";
import { OpenLlamaContentHandler } from "./services/content.handler";

dotenv.config({ path: __dirname+'/.env' });

const upload = multer({ dest: "/uploads"});

const client = new MongoClient(process.env.MONGO_URL!); 

// const model = new ChatOllama({
//     baseUrl: process.env.SAGE_MAKER_URL, // Default value
//     model: "llama2", // Default value
//   });
  
const app = express();
app.use(express.json());

app.post('/files', upload.single('file'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file was chosen for upload' });
    }
  
    const file = req.file;
    const appliedKey = 'original-file/' + file.originalname;
  
    //debugging catches just in case
    console.log(file);
    console.log(file.path);
  
    try {
            
        const pdfLoader = new PDFLoader(
            file.path
        );
    
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 500,
            chunkOverlap: 0
        });


        const docs = await pdfLoader.loadAndSplit(splitter);

        docs.map((doc, index) => {
        doc.metadata["page_number"] = index + 1;
        doc.metadata["filename"] = file.originalname
        });

        const service = new PineConeService();

        await service.saveData(docs, process.env.INDEX_NAME!);
      //if successful
      return res.status(200).json({ message: 'File successfully uploaded' });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: 'Upload Failed' });
    } finally {
      unlinkSync(file.path);
    }
  });
  
app.post('/qanda', async (req, res) => {
    const query = req.body.query as string;
    const service = new PineConeService();
    const vectorStore = await service.getVectorStore(process.env.INDEX_NAME!);
    
    const contentHandler = new OpenLlamaContentHandler()
    
    const model = new SageMakerEndpoint({
      endpointName: process.env.SAGE_MAKER_ENDPOINT!,
      modelKwargs: {
        temperature: 0.5,
        max_new_tokens: 700,
        top_p: 0.9,
      },
      endpointKwargs: {
        CustomAttributes: "accept_eula=true",
      },
      contentHandler: contentHandler,
      clientOptions: {
        region: "us-west-2",
        credentials: {
          accessKeyId: process.env.AWS_KEY!,
          secretAccessKey: process.env.AWS_SECRET_KEY!,
        },
      },
    });

    const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever(5));

    const response = await chain.call({
        query: query
    }); 

    return res.status(200).json({ message: response });
});
  
app.post('/query', async (req, res) => {
    const query = req.body.query as string;
    const service = new PineConeService();
    const embeddingsService = new OpenAIService();
    const embeddings = await embeddingsService.getEmbeddings(query);
    
    const result = await service.queryIndex(process.env.INDEX_NAME!, embeddings);

    return res.status(200).json({ result });
});
  
  const PORT = 8080;
  

client.connect().then(c => app.listen(PORT, () => console.log("Hola!")))
