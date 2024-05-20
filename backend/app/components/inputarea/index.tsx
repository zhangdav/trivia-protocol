interface InputAreaProps {
    period: string;
    isLoading: boolean;
    onPeriodChange: (event: {
        target: {
            value: any;
        };
    }) => void;
}

export default function InputArea({ period, isLoading, onPeriodChange }: InputAreaProps) {
    return (
        <div className="justify-center items-center my-1 space-y-4 bg-opacity-25 bg-gray-700 rounded-lg p-4">
            <h3 className="text-md leading-6 font-semibold">
                Write the date period when the event is happenning to create the trivia:
            </h3>
            <textarea className="w-full min-h-[50px] border rounded text-black" name="period" disabled={isLoading} id="text" placeholder="Write here either: last week/this week/next week" value={period} onChange={onPeriodChange} />
        </div>
    );
}