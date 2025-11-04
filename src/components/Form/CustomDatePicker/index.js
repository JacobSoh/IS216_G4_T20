"use client";

import { useId, useState, useMemo } from "react";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMotionTemplate, useMotionValue, motion } from "motion/react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const CONTROL_PRESETS = {
  startDateTime: { label: "Start Datetime", inputType: "text", placeholder: "Pick a date" },
  endDateTime: { label: "End Datetime", inputType: "text", placeholder: "Pick a date" },
};

function resolveControl(type) {
  return CONTROL_PRESETS[type] ?? { label: "", inputType: "text", placeholder: "Pick a date" };
}

const isFromNow = (input) => {
  const d = input instanceof Date ? input : new Date(input);
  const t = d.getTime();
  return Number.isFinite(t) && t >= Date.now();
};

const toHHMMSS = (d) =>
  [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");

const toDateLocal = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const toDatetimeLocalString = (d) => `${toDateLocal(d)}T${toHHMMSS(d)}`;

const mergeDateAndTime = (date, timeStr) => {
  const [h, m, s = "00"] = timeStr.split(":").map((x) => Number(x));
  const out = new Date(date);
  out.setHours(h || 0, m || 0, s || 0, 0);
  return out;
};

export function CustomerDatePicker({
  type,
  err,
  required,
  label,
  placeholder,
  fullWidth = true,
  id: idProp,
  defaultValue, // Date | string (ISO) | undefined
  ...rest
}) {
  const autoId = useId();
  const id = `fi-${type ?? "dt"}-${autoId}`;
  const preset = resolveControl(type);

  // Local states derived from initial value (or now)
  const initialDate = (() => {
    if (!defaultValue) return new Date();
    try {
      return defaultValue instanceof Date ? defaultValue : new Date(defaultValue);
    } catch {
      return new Date();
    }
  })();
  const [open, setOpen] = useState(false);
  const [dateVal, setDateVal] = useState(initialDate ?? null);           // Date | null
  const [timeVal, setTimeVal] = useState(toHHMMSS(initialDate));       // "HH:MM:SS"

  // Combined string for the <input type="datetime-local">
  const combined = useMemo(() => {
    return dateVal ? toDatetimeLocalString(mergeDateAndTime(dateVal, timeVal)) : "";
  }, [dateVal, timeVal]);

  // Hover glow wrapper to match Input/Textarea effect
  const radius = 100;
  const [hoverVisible, setHoverVisible] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label ?? preset.label}</FieldLabel>
      <div className="flex flex-col gap-3 w-full">
        <div className="flex gap-4 items-center w-full">
          {/* Date via calendar */}
          <Popover open={open} onOpenChange={setOpen}>
            <motion.div
              style={{
                background: useMotionTemplate`
                  radial-gradient(
                    ${hoverVisible ? radius + 'px' : '0px'} circle at ${mouseX}px ${mouseY}px,
                    var(--theme-secondary),
                    transparent 80%
                  )
                `,
              }}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setHoverVisible(true)}
              onMouseLeave={() => setHoverVisible(false)}
              className="rounded-md p-[2px] transition duration-300 w-full flex-1 min-w-0"
            >
              <PopoverTrigger asChild>
                <Button
                  variant="brand_darker"
                  id={`${id}-date`}
                  className="justify-between font-normal min-h-10 w-full"
                >
                  {dateVal ? dateVal.toLocaleDateString() : (placeholder ?? preset.placeholder)}
                  <ChevronDownIcon />
                </Button>
              </PopoverTrigger>
            </motion.div>
            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
              <Calendar
                mode="single"
                selected={dateVal ?? undefined}
                captionLayout="dropdown"
                buttonVariant="brand"
                onSelect={(date) => {
                  if (!date) return;
                  if (!isFromNow(date)) return; // keep your rule
                  setDateVal(date);
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>

          {/* Time field (controlled) */}
          <Input
            id={id}
            type="time"
            step="1"
            value={timeVal}
            onChange={(e) => {
              const raw = e.target.value;                 // "HH:MM" or "HH:MM:SS"
              const normalized = raw.length === 5 ? `${raw}:00` : raw;
              setTimeVal(normalized);                     // <- no notifyParent here
            }}
            className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none w-full flex-1 min-w-0"
          />
        </div>

        {/* REPLACE THIS ENTIRE SECTION at the end of your component */}
{/* The datetime value for form submission */}
<input
  key={`${type}-${combined}`} // Force re-render when value changes
  type="text"
  id={`${id}-datetime`}
  name={type ?? "datetime"}
  defaultValue={combined}
  style={{ display: 'none' }}
  readOnly
  tabIndex={-1}
  aria-hidden="true"
/>

      </div>

      <FieldError>{err}</FieldError>
    </Field>
  );
}
