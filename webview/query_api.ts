import {promptOfNlStatement, promptOfResponse, EXAMPLE_PROMPT } from "./prompting";
import { Configuration, OpenAIApi } from "openai";
import { AuthenticationSession } from 'vscode';

export interface Config {
    apiKey: string;
    chatImage: string;
    session: AuthenticationSession;
}

export async function getCompletionOfPrompt(
    openai : OpenAIApi,
    prompt : string,
    user: string,
    engine = "code-davinci-002",
    temperature = 0,
    max_tokens = 150,
    stop = ":=") {
    let response = await openai.createCompletion({
        model: engine,
        prompt: prompt,
        max_tokens: max_tokens,
        temperature: temperature,
        stop: stop
    })
    return response.data.choices[0].text
}

export async function isSafeOfResponse(
    lean_chat_config : Config,
    response : string
) {
    const myHeaders = new Headers()
    myHeaders.append('Content-Type', 'application/json')
    myHeaders.append('Authorization', 'Bearer ' + lean_chat_config.apiKey)

    const body = {input: response}

    const myInit = {
        method: 'POST', 
        body: JSON.stringify(body), 
        headers: myHeaders 
    }

    const myRequest = new Request('https://api.openai.com/v1/moderations')

    let resp_json = (await fetch(myRequest, myInit)).json()

    if ((await resp_json).results[0].flagged===1) {
        return false
    } else {
        return true 
    }
}


export async function runExample(key : string) {
    let openai = new OpenAIApi(new Configuration({apiKey : key}))
    let resp = await getCompletionOfPrompt(openai, EXAMPLE_PROMPT, "1");
    let context = EXAMPLE_PROMPT + resp;
    console.log(EXAMPLE_PROMPT + resp)
    let suggestion = "use `order_of` instead of `order`";
    let prompt = promptOfResponse(suggestion, context);
    let final = await getCompletionOfPrompt(openai, prompt, "1");
    return prompt + final
}