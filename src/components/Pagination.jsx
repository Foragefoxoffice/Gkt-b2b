import React from 'react';
import { MenuItem, Select } from '@mui/material';

const Pagination = ({ 
  page, 
  setPage, 
  totalPages, 
  limit, 
  setLimit, 
  totalItems, 
  itemName = 'items' 
}) => {
  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, page + 2);
    
    if (page <= 3) {
      end = Math.min(totalPages, 5);
    }
    if (page >= totalPages - 2) {
      start = Math.max(1, totalPages - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-white dark:bg-dark-card border-t border-slate-200 dark:border-dark-border gap-4">
      {/* Left side: Info and Limit selector */}
      <div className="flex items-center text-sm text-slate-600 dark:text-slate-400 flex-wrap gap-y-2">
        <span>
          Showing <span className="font-semibold text-slate-800 dark:text-white">{startItem}</span> to <span className="font-semibold text-slate-800 dark:text-white">{endItem}</span> of <span className="font-semibold text-slate-800 dark:text-white">{totalItems}</span> {itemName}
        </span>
        <span className="mx-3 text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>
        <div className="flex items-center">
          <span className="mr-2">Show</span>
          <Select
            value={limit}
            onChange={(e) => {
              setLimit(e.target.value);
              setPage(1); // Reset to page 1 on limit change
            }}
            size="small"
            className="bg-white dark:bg-dark-bg"
            sx={{
              minWidth: 70,
              height: 32,
              '.MuiSelect-select': { py: 0.5, px: 1.5, fontSize: '0.875rem' },
            }}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
          </Select>
        </div>
      </div>

      {/* Right side: Page navigation */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
        >
          Previous
        </button>

        {getPageNumbers().map(p => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`w-8 h-8 flex items-center justify-center text-sm font-medium rounded-md transition-colors ${
              page === p
                ? 'bg-[#c07628] text-white border border-[#c07628] shadow-sm'
                : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || totalPages === 0}
          className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
