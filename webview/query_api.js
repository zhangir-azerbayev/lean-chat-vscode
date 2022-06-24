const { promptOfNlStatement, promptOfResponse, EXAMPLE_PROMPT } = require("./prompting");
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export async function getCompletionOfPrompt(prompt,
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

export async function runExample() {
    ; h
    let resp = await getCompletionOfPrompt(EXAMPLE_PROMPT);
    let context = EXAMPLE_PROMPT + resp;
    console.log(EXAMPLE_PROMPT + resp)
    let suggestion = "use `order_of` instead of `order`";
    let prompt = promptOfResponse(suggestion, context);
    let final = await getCompletionOfPrompt(prompt);
    console.log(prompt + final)
}