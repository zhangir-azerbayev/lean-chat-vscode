import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.css'
import { getCompletionOfPrompt, isSafeOfResponse, runExample } from './query_api';
// import "react-chat-elements/dist/main.css";
import './tachyons.css'
import { MessageBox, MessageList } from './Chat'
import { Configuration, OpenAIApi } from 'openai';
import { promptOfNlStatement, promptOfResponse} from './prompting';
import { AuthenticationSession } from 'vscode';

// this is injected in extension.ts
declare const LEAN_CHAT_CONFIG: Config

interface Config {
    apiKey: string;
    chatImage: string;
    session: AuthenticationSession;
}

interface Bubble {
    user: 'codex' | 'me';
    type: 'nl' | 'code';
    plaintext: string;
}

const DEMO = "If $x$ is an element of infinite order in $G$, prove that the elements $x^n$, $n\\in\\mathbb{Z}$ are all distinct."
const openai = new OpenAIApi(new Configuration({ apiKey: LEAN_CHAT_CONFIG.apiKey }))

function Main({ config }: { config: Config }) {

    const [bubbles, pushBubble] = React.useReducer((state: Bubble[], action: Bubble) => [...state, action], [])
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
            if (bubbles.length!==0) {
                const context = bubbles.map(x => x["plaintext"]).join("")
                prompt = promptOfResponse(inputText, context)
            } else {
                prompt = promptOfNlStatement(inputText)
            }
            const user = LEAN_CHAT_CONFIG.session.account.id; 
            var response = await getCompletionOfPrompt(openai, prompt, user)

            if (isSafeOfResponse(openai, response)) {
                pushBubble({user: "codex", plaintext: response + ":=", type: 'code'})
            } else {
                const message = "Codex generated an unsafe output. Hit clear and try again"
                pushBubble({user: "codex", plaintext: response, type: 'code'})
            }
        }
        catch (e) {
            setError(e.message)
        }
        finally {
            setPending(false)
        }
    }

    return <div>
        <h1 className="foo">Welcome {LEAN_CHAT_CONFIG.session.account.label} to Lean chat!</h1>

        <MessageList>
            {bubbles.map((bubble, i) => <MessageBox key={i} dir={bubble.user === 'codex' ? "left" : "right"}>{bubble.type === 'code' ? <ShowCodeBubble {...bubble} /> : bubble.plaintext}</MessageBox>)}
            {pending && <MessageBox key={"..."} dir='left'><div className="loader">Loading...</div></MessageBox>}
        </MessageList>

        {error && <div className="red">{error}</div>}

        <form onSubmit={handleSubmit}>
            <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} />
            <input type="submit" value="Send" disabled={pending} />
        </form>
        <button onClick={() => setInputText(DEMO)}>Demo</button>
    </div>
}

function ShowCodeBubble(props: Bubble) {
    return <div>
        <code className="font-code" style={{ whiteSpace: 'break-spaces' }}>theorem{props.plaintext}</code>
    </div>
}

const domContainer = document.querySelector('#react_root');
ReactDOM.render(<Main config={LEAN_CHAT_CONFIG} />, domContainer);
