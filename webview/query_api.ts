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

export async function isSafeOfResponse(
    openai : OpenAIApi, 
    response : string
) {
    const threshold = -0.355; 
    const prompt = "<|endoftext|>${response}\n--\nLabel:"; 
    let output = await openai.createCompletion({
        model: "content-filter-alpha", 
        prompt: prompt, 
        max_tokens: 1, 
        temperature: 0.0, 
        top_p: 0.0, 
        logprobs: 10, 
    })
    const token = output.data.choices[0].text
    const logprob = output.data.choices[0].logprobs.top_logprobs[0]["2"]
    if (output.data.choices[0].text==="2" && logprob < threshold) {
        return true 
    } else {
        return false 
    }
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