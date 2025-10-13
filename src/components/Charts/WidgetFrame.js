export default function WidgetFrame({ title, onRemove, children }) {
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                <span className="text-sm text-white/80">{title}</span>
                <button
                    onClick={onRemove}
                    className="rounded-md px-2 py-1 text-xs bg-white/10 hover:bg-white/20"
                >
                    Remove
                </button>
            </div>
            <div className="flex-1">{children}</div>
        </div>
    );
}