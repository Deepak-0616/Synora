import { Inbox } from "lucide-react";
export const EmptyState = ({
  title,
  description,
  icon,
  action
}) => {
  return <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
      <div className="p-3.5 rounded-full bg-slate-100 text-slate-500 mb-4">
        {icon || <Inbox className="w-8 h-8" />}
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>;
};
