import {promptOfNlStatement, promptOfResponse, EXAMPLE_PROMPT } from "./prompting";
import { Configuration, OpenAIApi } from "openai";

export async function getCompletionOfPrompt(
    openai :OpenAIApi,
    prompt : string,
    engine = "code-davinci-002",
    temperature = 0,
    max_tokens = 150,
    stop = ":=") {
    let response = await openai.createCompletion({
        model: engine,
        prompt,
        max_tokens,
        temperature,
        stop
    })
    return response.data.choices[0].text
}


export async function runExample(key : string) {
    let openai = new OpenAIApi(new Configuration({apiKey : key}))
    let resp = await getCompletionOfPrompt(openai, EXAMPLE_PROMPT);
    let context = EXAMPLE_PROMPT + resp;
    console.log(EXAMPLE_PROMPT + resp)
    let suggestion = "use `order_of` instead of `order`";
    let prompt = promptOfResponse(suggestion, context);
    let final = await getCompletionOfPrompt(openai, prompt);
    return prompt + final
}