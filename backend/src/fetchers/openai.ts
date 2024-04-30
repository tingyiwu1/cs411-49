import OpenAI from "openai";
import {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
} from "openai/resources";

export async function getCompletion(
  openai: OpenAI,
  messages: ChatCompletionMessageParam[]
) {
  const stream = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages,
    stream: true,
  });

  const response: ChatCompletionMessage = {
    role: "assistant",
    content: "",
  };

  for await (const message of stream) {
    const delta = message.choices[0]?.delta.content ?? "";
    response.content += delta;
    process.stdout.write(delta);
  }
  process.stdout.write("\n");

  messages.push(response);
  return response;
}
