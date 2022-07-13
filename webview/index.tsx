import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.css'
import { getCompletionOfPrompt, isSafeOfResponse, runExample } from './query_api';
// import "react-chat-elements/dist/main.css";
import './tachyons.css'
import { MessageBox, MessageList } from './Chat'
import { Configuration, OpenAIApi } from 'openai';
import { promptOfNlStatement, promptOfResponse } from './prompting';
import { AuthenticationSession } from 'vscode';
import { MathJax, MathJaxContext } from 'better-react-mathjax'

interface Config {
    apiKey: string;
    chatImage: string;
    session: AuthenticationSession;
}

// this is injected in extension.ts
declare const LEAN_CHAT_CONFIG: Config

declare const acquireVsCodeApi;
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const vscode = acquireVsCodeApi();

type FromWebviewMessage = InsertTextMessage | CopyTextMessage

export function post(message: FromWebviewMessage): void { // send a message to the extension
    vscode.postMessage(message);
}

export interface CopyTextMessage {
    command: 'copy_text';
    text: string;
}

interface InsertTextMessage {
    command: 'insert_text';
    /** If no location is given set to be the cursor position. */
    loc?: Location;
    text: string;
    insert_type: 'absolute' | 'relative';
}

interface Bubble {
    user: 'codex' | 'me';
    type: 'nl' | 'code';
    plaintext: string;
}

const DEMO = "If $x$ is an element of infinite order in $G$, prove that the elements $x^n$, $n\\in\\mathbb{Z}$ are all distinct."
const openai = new OpenAIApi(new Configuration({ apiKey: LEAN_CHAT_CONFIG.apiKey }))

function Main({ config }: { config: Config }) {

    const [bubbles, pushBubble] = React.useReducer((state: Bubble[], action: Bubble | 'clear') => {
        if (action === 'clear') {
            return []
        } else {
            return [...state, action]
        }
    }, [])
    const [pending, setPending] = React.useState<boolean>(false)
    const [error, setError] = React.useState<string | undefined>(undefined)
    const [inputText, setInputText] = React.useState("")

    async function handleSubmit(event) {
        event.preventDefault();
        if (pending) {
            return
        }
        pushBubble({ user: 'me', plaintext: inputText, type: 'nl' })
        setInputText("")
        setError(undefined)
        setPending(true)
        try {
            var prompt;
            if (bubbles.length !== 0) {
                const context = bubbles.map(x => x.plaintext).join("")
                prompt = promptOfResponse(inputText, context)
            } else {
                prompt = promptOfNlStatement(inputText)
            }
            const user = LEAN_CHAT_CONFIG.session.account.id;
            var response = await getCompletionOfPrompt(openai, prompt, user)

            if (await isSafeOfResponse(openai, response)) {;
                pushBubble({ user: "codex", plaintext: response + ":=", type: 'code' })
            } else {
                const message = "Codex generated an unsafe output. Hit clear and try again"
                pushBubble({ user: "codex", plaintext: response, type: 'code' })
            }
        }
        catch (e) {
            setError(e.message)
        }
        finally {
            setPending(false)
        }
    }

    return <MathJaxContext onLoad={() => console.log("loaded mathjax")} onStartup={(m) =>console.log(m)}>
        <div>
            <h1 className="foo">Welcome {LEAN_CHAT_CONFIG.session.account.label} to Lean chat!</h1>

            <MessageList>
                {bubbles.map((bubble, i) =>
                  <MessageBox key={i} dir={bubble.user === 'codex' ? "left" : "right"}>
                    {bubble.type === 'code' ? <ShowCodeBubble {...bubble} /> : <ShowNlBubble {...bubble}/>}
                </MessageBox>)}
                {pending && <MessageBox key={"..."} dir='left'><div className="loader">Loading...</div></MessageBox>}
            </MessageList>

            {error && <div className="red">{error}</div>}

            <form onSubmit={handleSubmit}>
                <textarea className="db" style={{ width: '100%' }} value={inputText} onChange={e => setInputText(e.target.value)} />
                <input className="db" type="submit" value="Send" disabled={pending} />
            </form>
            <div>
                <button className="ma2" title="Try it out with demo text" onClick={() => setInputText(DEMO)}>Demo</button>
                <button className="ma2" title="Clear the chat" onClick={() => pushBubble('clear')}>Clear</button>
                <button className="ma2" title="Paste the bubbles to buffer" onClick={() => post({command:'copy_text', text: JSON.stringify(bubbles)})}>Copy as JSON</button>
            </div>
        </div>
    </MathJaxContext>
}

function wrapby(items: (any[]) | string, fence : string, out : (x:string) => any) {
    if (typeof(items) === "string") {
        items = [items]
    }
    function * core() {
        for (const item of items) {
            if (typeof(item) === "string") {
                let xs = item.split(fence)
                if (xs.length % 2 !== 1) {
                    throw new Error(`Bad split on "${fence}": ${xs}`)
                }
                let text; let inner
                while (xs.length >= 2) {
                    [text, inner, ...xs] = xs
                    yield text
                    yield out(inner)
                }
                let [final] = xs
                yield final
            } else {
                yield item
            }
        }
    }
    try {
        return [...core()]
    }
    catch (e) {
        return items
    }
}

const  ShowNlBubble = React.memo(function(props: Bubble) {
    let text : any = props.plaintext
    text = wrapby(text, "$", tex => <MathJax inline={true}>{`\\(${tex}\\)`}</MathJax>)
    text = wrapby(text, "`", x => <code className="font-code">{x}</code>)
    return <div>
        {text}
    </div>
})

function ShowCodeBubble(props: Bubble) {
    let text = `theorem ${props.plaintext}`
    return <div>
        <code className="font-code" style={{ whiteSpace: 'break-spaces' }}>{text}</code>
        <div>
            <button title="Paste to document" onClick={() => post({ command: 'insert_text', text, insert_type: 'relative' })}>📋</button>
        </div>
    </div>
}

const domContainer = document.querySelector('#react_root');
ReactDOM.render(<Main config={LEAN_CHAT_CONFIG} />, domContainer);
