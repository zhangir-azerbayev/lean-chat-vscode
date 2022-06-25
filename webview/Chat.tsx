
/* Chat components source: https://github.com/Detaysoft/react-chat-elements
MIT Licenced.
*/
import * as React from 'react'
import './Chat.css'

interface MessageBoxProps {
    children: any;
    dir: 'left' | 'right';
}

export function MessageBox(props: MessageBoxProps) {
    if (props.dir === 'left') {
        return <LeftMessageBox {...props} />
    } else if (props.dir === 'right') {
        return <RightMessageBox {...props} />
    }
}

export function MessageList(props: { children: any }) {
    return <div className="rce-container-mlist message-list">
        <div className="rce-mlist">
            {props.children}
        </div>
    </div>
}

function RightMessageBox(props: MessageBoxProps) {
    return <div className="rce-container-mbox">
        <div className="rce-mbox rce-mbox-right">
            <div className="rce-mbox-body">
                {props.children}
            </div>
            <svg className="rce-mbox-right-notch" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M0 0v20L20 0">
                </path>
            </svg>
        </div>
    </div>
}

function LeftMessageBox(props: MessageBoxProps) {
    return <div className="rce-container-mbox">
        <div className="rce-mbox">
            <div className="rce-mbox-body">
                <div className="rce-mbox-text">{props.children}</div>
            </div>
            <div>
                <svg className="rce-mbox-left-notch" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <defs>
                        <filter id="filter1" x="0" y="0">
                            <feOffset result="offOut" in="SourceAlpha" dx="-2" dy="-5">
                            </feOffset>
                            <feGaussianBlur result="blurOut" in="offOut" stdDeviation="3">
                            </feGaussianBlur>
                            <feBlend in="SourceGraphic" in2="blurOut" mode="normal">
                            </feBlend>
                        </filter>
                    </defs>
                    <path d="M20 0v20L0 0" filter="url(#filter1)">
                    </path>
                </svg>
            </div>
        </div>
    </div>
}