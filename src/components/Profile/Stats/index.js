export default function Stats({ title, number }) {
  return (
    <div className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-600">
      <span className="font-bold text-blue-400">{number}</span>
      <span className="text-slate-400 ml-1">{title}</span>
    </div>
  );
};