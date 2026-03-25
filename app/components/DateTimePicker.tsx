import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function DateTimePicker({ value, onChange, className }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  const [viewDate, setViewDate] = useState<Date>(value ? new Date(value) : new Date());
  const [view, setView] = useState<"date" | "time">("date");
  const containerRef = useRef<HTMLDivElement>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setViewDate(date);
      }
    }
  }, [value]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setView("date");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDateDisplay = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    
    // Si ya había hora seleccionada, mantenerla
    if (selectedDate) {
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
    } else {
      // Si es nuevo, poner hora actual redondeada a 10 mins
      const now = new Date();
      const minutes = Math.ceil(now.getMinutes() / 10) * 10;
      newDate.setHours(now.getHours());
      newDate.setMinutes(minutes);
    }
    
    setSelectedDate(newDate);
    setView("time"); // Cambiar a vista de hora
  };

  const handleTimeSelect = (hour: number, minute: number) => {
    if (!selectedDate) return;
    
    const finalDate = new Date(selectedDate);
    finalDate.setHours(hour);
    finalDate.setMinutes(minute);
    
    // Format to YYYY-MM-DDTHH:mm for datetime-local compatibility
    const year = finalDate.getFullYear();
    const month = String(finalDate.getMonth() + 1).padStart(2, "0");
    const day = String(finalDate.getDate()).padStart(2, "0");
    const hh = String(finalDate.getHours()).padStart(2, "0");
    const mm = String(finalDate.getMinutes()).padStart(2, "0");
    
    const formatted = `${year}-${month}-${day}T${hh}:${mm}`;
    
    setSelectedDate(finalDate);
    onChange(formatted);
    setIsOpen(false);
    setView("date");
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 10) {
        slots.push({ hour: h, minute: m });
      }
    }
    return slots;
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Adjust for Monday start
  };

  const changeMonth = (increment: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + increment, 1));
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const padding = Array.from({ length: firstDay }, (_, i) => i);
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={(e) => { e.stopPropagation(); changeMonth(-1); }}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
          </button>
          <span className="font-bold text-slate-900 capitalize">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); changeMonth(1); }}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
            <div key={d} className="text-center text-xs font-bold text-slate-400">
              {d}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {padding.map((i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((day) => {
            const date = new Date(year, month, day);
            const isSelected = selectedDate && 
              date.getDate() === selectedDate.getDate() &&
              date.getMonth() === selectedDate.getMonth() &&
              date.getFullYear() === selectedDate.getFullYear();
            
            const isToday = 
              day === new Date().getDate() &&
              month === new Date().getMonth() &&
              year === new Date().getFullYear();

            return (
              <button
                key={day}
                onClick={(e) => { e.stopPropagation(); handleDateSelect(day); }}
                className={`
                  h-9 w-9 rounded-full text-sm font-medium transition-all flex items-center justify-center
                  ${isSelected 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                    : isToday 
                      ? "bg-blue-50 text-blue-600 font-bold border border-blue-100" 
                      : "text-slate-700 hover:bg-slate-100"}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTimePicker = () => {
    const slots = generateTimeSlots();
    
    return (
      <div className="p-4 flex flex-col h-full max-h-[350px]">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setView("date"); }}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="w-3 h-3" />
            Volver
          </button>
          <span className="font-bold text-slate-900">
            Selecciona hora
          </span>
          <div className="w-12"></div> {/* Spacer for centering */}
        </div>
        
        <div className="overflow-y-auto pr-2 grid grid-cols-3 gap-2 flex-1 custom-scrollbar">
          {slots.map(({ hour, minute }) => {
            const timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
            const isSelected = selectedDate && 
              selectedDate.getHours() === hour && 
              selectedDate.getMinutes() === minute;

            return (
              <button
                key={`${hour}-${minute}`}
                onClick={(e) => { e.stopPropagation(); handleTimeSelect(hour, minute); }}
                className={`
                  py-2 px-1 rounded-lg text-sm font-medium transition-all border
                  ${isSelected 
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                    : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50"}
                `}
              >
                {timeString}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between cursor-pointer rounded-xl border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition-all outline-none
          ${isOpen ? "border-blue-500 ring-4 ring-blue-500/10 bg-white" : "border-slate-200 hover:border-blue-300 focus:border-blue-500"}
          ${className || "w-full"}
        `}
      >
        <span className={selectedDate ? "text-slate-900" : "text-slate-400"}>
          {selectedDate ? formatDateDisplay(selectedDate) : "Selecciona fecha y hora"}
        </span>
        <FontAwesomeIcon icon={faCalendar} className="text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 left-0 w-full min-w-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 animate-in fade-in zoom-in-95 duration-200 origin-top-left">
          {view === "date" ? renderCalendar() : renderTimePicker()}
        </div>
      )}
    </div>
  );
}
