import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.css'

function Main() {
    return <div className="foo">
        <h1>Welcome to Lean chat!</h1>
        <p>lorem ipsum dolor sit amet, consectetur adip</p>
    </div>
}

const domContainer = document.querySelector('#react_root');
ReactDOM.render(<Main />, domContainer);