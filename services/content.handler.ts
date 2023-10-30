import {
  SageMakerLLMContentHandler,
} from "langchain/llms/sagemaker_endpoint";

export class OpenLlamaContentHandler implements SageMakerLLMContentHandler {
    contentType = "application/json";
  
    accepts = "application/json";
  
    async transformInput(
      prompt: string,
      modelKwargs: Record<string, unknown>
    ): Promise<Uint8Array> {
      const payload = {
        text_inputs: prompt,
        max_length: 800,
        return_full_text: false
      };
  
      const stringifiedPayload = JSON.stringify(payload);
  
      return new TextEncoder().encode(stringifiedPayload);
    }
  
    async transformOutput(output: Uint8Array): Promise<string> {
      const response_json = JSON.parse(
        new TextDecoder("utf-8").decode(output)
      ) as ResponseJsonInterface;
      console.log("response: ", response_json);
      const content = response_json?.generated_texts[0] ?? "";
      const cr = content.indexOf("Question:");

      return content.substring(0, cr < 0 ? undefined : cr);
    }
  }

  
export interface ResponseJsonInterface {
  generated_texts: string[];
}