import {useEffect, useRef, useState} from "react";

export default function ExportDropdown({
  options = [],
  buttonLabel = "EXPORTAR",
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block" ref={exportRef} style={{ width: "auto" }}>
      <button
        onClick={() => setMenuOpen((open) => !open)}
        className={`bg-[#EAEAEA] text-gray-500 px-16 py-2 shadow-md rounded-lg border hover:bg-white w-full min-w-[160px] transition-all duration-300 ${menuOpen ? "ring-2 ring-primary" : ""}`}
        style={{ width: "100%" }}
      >
        {buttonLabel}
      </button>
      <div
        className={`absolute right-0 bottom-full mb-2 bg-white border rounded-lg shadow-lg flex flex-col z-10 w-full transition-all duration-300 origin-bottom ${menuOpen ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0 pointer-events-none"}`}
        style={{ width: "100%" }}
      >
        {options.map(({ label, onClick }, idx) => (
          <button
            key={label + idx}
            onClick={() => { onClick(); setMenuOpen(false); }}
            className="px-4 py-2 text-left hover:bg-gray-100 text-gray-700 w-full"
          >{label}</button>
        ))}
      </div>
    </div>
  );
}
