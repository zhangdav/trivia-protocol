interface GeneratedTriviaProps {
    trivia: string;
    onButtonClicked: () => void;
}

export default function GeneratedTrivia({ trivia, onButtonClicked }: GeneratedTriviaProps) {
    return (
        <div className="flex flex-col gap-2">
            {/* ... generated trivia content ... */}
            <div className="space-y-2">
                <h2 className="text-xl text-green-500 font-semibold tracking-tight">Here is the trivia json:</h2>
            </div>
            <textarea
                className="min-h-[200px] border text-black p-3 m-2 rounded"
                id="trivia"
                placeholder="The trivia will appear here."
                value={trivia}
                readOnly
            />
            <div className="flex flex-row items-center text-center gap-2 m-2">
                <p className="text-md leading-6 b-0 text-white">
                    Click the icon to copy the json text to clipboard:
                </p>
                <a
                    className="hover:bg-green-500 text-green-500 hover:text-white border border-green-500 p-2 rounded disabled:opacity-50"
                    onClick={onButtonClicked}>
                    <svg className="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 9v6a4 4 0 0 0 4 4h4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1v2Z" />
                        <path d="M13 3.054V7H9.2a2 2 0 0 1 .281-.432l2.46-2.87A2 2 0 0 1 13 3.054ZM15 3v4a2 2 0 0 1-2 2H9v6a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3Z" />
                    </svg>
                </a>
            </div>
        </div>
    );
}