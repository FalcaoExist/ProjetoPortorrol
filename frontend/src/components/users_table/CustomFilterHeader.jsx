import React from "react";
import { Popover } from "@mui/material";
import { FiChevronDown } from "react-icons/fi";
import FilterPopoverContent from "./FilterPopoverContent";

const CustomFilterHeader = React.memo(({
  columnId, label, activeColumnId, anchorEl, handleHeaderClick, handleClose, filterType, placeholder, options, filters, handleFilterChange,
}) => {
  const open = activeColumnId === columnId;
  return (
    <>
      <button
        type="button"
        onClick={(event) => handleHeaderClick(event, columnId)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px', paddingBottom: '8px',
          border: 'none', background: 'none', cursor: 'pointer', color: 'inherit',
          transition: 'color 150ms ease-in-out', width: '100%', textAlign: 'left', fontFamily: 'Poppins'
        }}
      >
        <span>{label}</span>
        <FiChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms ease-in-out" }} />
      </button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <FilterPopoverContent
            column={{ id: columnId, label, filterType, placeholder, options }}
            value={filters[columnId]}
            onChange={(value) => handleFilterChange(columnId, value)}
            onClose={handleClose}
        />
      </Popover>
    </>
  );
});

export default CustomFilterHeader;