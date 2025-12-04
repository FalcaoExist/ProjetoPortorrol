import React from "react";
import { Popover } from "@mui/material";
import { FiChevronDown } from "react-icons/fi";
import FilterPopoverContent from "./FilterPopoverContent";

const CustomFilterHeader = React.memo(function CustomFilterHeader({
    columnId,
    label,
    activeColumnId,
    anchorEl,
    onOpen,
    onClose,
    filterType,
    placeholder,
    options,
    filters,
    onFilterChange,
}) {
    const open = activeColumnId === columnId;

    return (
        <>
            <button
                type="button"
                onClick={(event) => onOpen(event, columnId)}
                className="flex w-full items-center gap-2 py-2 text-left font-poppins transition-colors duration-150 focus:outline-none"
            >
                <span>{label}</span>
                <FiChevronDown
                    size={14}
                    className={`transition-transform duration-150 ${open ? "rotate-180" : "rotate-0"}`}
                />
            </button>
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={onClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
            >
                <FilterPopoverContent
                    column={{ id: columnId, label, filterType, placeholder, options }}
                    value={filters[columnId]}
                    onChange={(value) => onFilterChange(columnId, value)}
                    onClose={onClose}
                />
            </Popover>
        </>
    );
});

export default CustomFilterHeader;
