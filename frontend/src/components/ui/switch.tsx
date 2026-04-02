import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "relative w-[51px] h-[31px] rounded-[16px]",
        "bg-[#e9e9eb]",
        "data-[state=checked]:bg-[#e05d38]",
        "transition-all duration-200 ease-out cursor-pointer",
        "border border-black/10",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "absolute w-[27px] h-[27px] rounded-full bg-white",
          "top-1/2 -translate-y-1/2",
          "left-[2px]",
          "data-[state=checked]:left-[22px]",
          "shadow-[0px_3px_8px_rgba(0,0,0,0.15),0px_3px_1px_rgba(0,0,0,0.06)]",
          "transition-all duration-200 ease-out"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }