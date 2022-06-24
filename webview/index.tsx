import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.css'
import {runExample} from './query_api';




function Main() {

    const [result, setResult] = React.useState(undefined)
    const [openaikey, setOpenaikey] = React.useState(undefined)

    React.useEffect(() => {
        window.addEventListener('message', event => {
        const message = event.data;
        if (message.command == "key") {
            setOpenaikey(message.key)
        }
        })
    })

    function onclick () {
        setResult("asking OpenAI!")
        runExample(openaikey).then(s => setResult(s)).catch(err => setResult(err.message))
    }


    return <div>
        <h1 className="foo">Welcome to Lean chat!</h1>
        <p>lorem ipsum dolor sit amet, consectetur adip</p>
        <button onClick={onclick}>Run!</button>
        <p>Result: {result ?? "click the button to run!"}</p>
    </div>
}

const domContainer = document.querySelector('#react_root');
ReactDOM.render(<Main />, domContainer);
