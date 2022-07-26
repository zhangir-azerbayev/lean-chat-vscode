import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.css'
import './tachyons.css'
import { MessageBox, MessageList } from './Chat'
import { AuthenticationSession } from 'vscode';
import { MathJax, MathJaxContext } from 'better-react-mathjax'

interface Config {
    chatImage: string;
    session: AuthenticationSession;
    LEAN_CHAT_API_URL: string
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
    id?: string;
}

const DEMO = "If $x$ is an element of infinite order in $G$, prove that the elements $x^n$, $n\\in\\mathbb{Z}$ are all distinct."

function Main({ config }: { config: Config }) {

    const [bubbles, pushBubble] = React.useReducer((state: Bubble[], action: Bubble | 'clear_one' | 'clear_all') => {
        if (action === 'clear_all') {
            return []
        } else if (action === 'clear_one') {
            return state.slice(0,-1)
        } else {
            return [...state, action]
        }
    }, [])
    const [pending, setPending] = React.useState<boolean>(false)
    const [error, setError] = React.useState<string | undefined>(undefined)
    const [inputText, setInputText] = React.useState("")

    const [pingText, setPingText] = React.useState("")

    async function handlePing(event) {
        event.preventDefault()
        setPingText(`pinging ${config.LEAN_CHAT_API_URL}...`)
        const resp = await fetch(config.LEAN_CHAT_API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ session: config.session, kind: 'ping' }),
        })
        setPingText(JSON.stringify(await resp.json()))
    }

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
            const resp = await fetch(config.LEAN_CHAT_API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ session: config.session, bubbles, inputText, kind: 'chat' }),

            });
            if (!resp.ok) {
                throw new Error(await resp.text())
            }
            const { newBubble, email } = await resp.json()
            pushBubble(newBubble)
        }
        catch (e) {
            setError(e.message)
        }
        finally {
            setPending(false)
        }
    }

    return <MathJaxContext onLoad={() => console.log("loaded mathjax")} onStartup={(m) => console.log(m)}>
        <div>
            <h2>Welcome {LEAN_CHAT_CONFIG.session.account.label} to Lean chat!</h2>

            <p>Type a natural language theorem in LaTeX and click 'Send' to produce a formal theorem statement. If the formal statement is wrong, you can respond with instructions about what to correct.</p>

            <p style={{ color: 'grey' }}>Please note that your requests will be sent to {LEAN_CHAT_CONFIG.LEAN_CHAT_API_URL} and saved to improve future translations.</p>

            <MessageList>
                {bubbles.map((bubble, i) =>
                    <MessageBox key={i} dir={bubble.user === 'codex' ? "left" : "right"}>
                        {bubble.type === 'code' ? <ShowCodeBubble {...bubble} /> : <ShowNlBubble {...bubble} />}
                    </MessageBox>)}
                {pending && <MessageBox key={"..."} dir='left'><div className="loader">Loading...</div></MessageBox>}
            </MessageList>

            {error && <div className="red">{error}</div>}

            <form onSubmit={handleSubmit}>
                <textarea
                    className="db border-box b--black-20 pa2 br2 ma2"
                    style={{ width: '100%' }}
                    value={inputText}
                    placeholder={`Type a natural language theorem statement here. E.g: ${DEMO}`}
                    onChange={e => setInputText(e.target.value)} />
                <input className="db ma2" type="submit" value="Send" disabled={pending} />
            </form>
            <div>
                <button className="ma2" title="Try it out with demo text" onClick={() => setInputText(DEMO)}>Demo</button>
                <button className="ma2" title="Clear one bubble" onClick={() => pushBubble('clear_one')}>Clear</button>
                <button className="ma2" title="Clear the chat" onClick={() => pushBubble('clear_all')}>Clear all</button>
            </div>
            <div>
                <button className="ma2" onClick={handlePing}>ping server</button>
                <div>{pingText}</div>
            </div>
        </div>
    </MathJaxContext>
}

function wrapby(items: (any[]) | string, fence: string, out: (x: string, idx: number) => any) {
    if (typeof (items) === "string") {
        items = [items]
    }
    function* core() {
        for (const item of items) {
            if (typeof (item) === "string") {
                let xs = item.split(fence)
                if (xs.length % 2 !== 1) {
                    throw new Error(`Bad split on "${fence}": ${xs}`)
                }
                let text; let inner
                while (xs.length >= 2) {
                    [text, inner, ...xs] = xs
                    yield text
                    yield out(inner, xs.length)
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

const ShowNlBubble = React.memo(function (props: Bubble) {
    let text: any = props.plaintext
    text = wrapby(text, "$", (tex, i) => <MathJax inline={true} key={`math-${i}`}>{`\\(${tex}\\)`}</MathJax>)
    text = wrapby(text, "`", (x, i) => <code className="font-code" key={`code-${i}`}>{x}</code>)
    return <div>
        {text}
    </div>
})

function ShowCodeBubble(props: Bubble) {
    let config = LEAN_CHAT_CONFIG
    let text = `theorem ${props.plaintext}`
    const [response, setResp] = React.useState(undefined)
    const handleFeedback = async (val: number) => {
        setResp('loading')
        const resp = await fetch(config.LEAN_CHAT_API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ session: config.session, val, responseId: props.id, kind: 'rating', }),

        });
        if (!resp.ok) {
            const msg = resp.text()
            setResp(`errored: ${msg}`)
        }
        const { message } = await resp.json()
        setResp(message)
    }
    return <div>
        <code className="font-code" style={{ whiteSpace: 'break-spaces' }}>{text}</code>
        <div className="mv2">
            <a href="#" className="link black hover-bg-light-blue mh2" title="Paste to document" onClick={() => post({ command: 'insert_text', text, insert_type: 'relative' })}>📋</a>
            {!response && props.id && <a href="#" className="link black hover-bg-light-blue mh2" title="This is a good suggestion" onClick={() => handleFeedback(1)}>👍</a>}
            {!response && props.id && <a href="#" className="link black hover-bg-light-blue mh2" title="This is a bad suggestion" onClick={() => handleFeedback(-1)}>👎</a>}
            {response && (
                response === 'loading'
                    ? <span className="mh2">Loading...</span>
                    : <span className="mh2">{response}</span>)}
        </div>
    </div>
}

const domContainer = document.querySelector('#react_root');
ReactDOM.render(<Main config={LEAN_CHAT_CONFIG} />, domContainer);
