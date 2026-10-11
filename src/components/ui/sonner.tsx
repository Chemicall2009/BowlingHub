import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-zinc-900 group-[.toaster]:text-zinc-100 group-[.toaster]:border-zinc-800 group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl font-sans",
          description: "group-[.toast]:text-zinc-400",
          actionButton:
            "group-[.toast]:bg-emerald-600 group-[.toast]:text-white font-medium",
          cancelButton:
            "group-[.toast]:bg-zinc-800 group-[.toast]:text-zinc-300",
          success: "group-[.toaster]:border-emerald-700/50",
          error: "group-[.toaster]:border-red-700/50",
          warning: "group-[.toaster]:border-amber-700/50",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
