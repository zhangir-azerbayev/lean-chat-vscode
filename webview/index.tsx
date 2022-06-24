import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.css'
import {runExample} from './query_api';

function Main() {

    const [result, setResult] = React.useState(undefined)
    React.useEffect(() => {
        runExample().then(s => setResult(s)).catch(err => setResult(err.message))
    }, [])

    return <div className="foo">
        <h1>Welcome to Lean chat!</h1>
        <p>lorem ipsum dolor sit amet, consectetur adip</p>
        <p>Result {result ?? "pending"}</p>
    </div>
}

const domContainer = document.querySelector('#react_root');
ReactDOM.render(<Main />, domContainer);
