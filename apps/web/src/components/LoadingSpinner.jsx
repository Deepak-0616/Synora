export const LoadingSpinner = ({ message = "Loading...", size = "md" }) => {
  const spinnerSize = size === "sm" ? "w-5 h-5 border-2" : size === "lg" ? "w-10 h-10 border-4" : "w-7 h-7 border-3";
  return <div className="flex flex-col items-center justify-center p-8 gap-3">
      <div className={`${spinnerSize} rounded-full border-blue-200 border-t-blue-600 animate-spin`} />
      {message && <p className="text-xs font-semibold text-slate-500 animate-pulse">{message}</p>}
    </div>;
};
