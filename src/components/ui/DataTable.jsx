import React, { useState } from "react";
import LoadingSpinner from "./LoadingSpinner";
import EmptyState from "./EmptyState";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

export const DataTable = ({ 
  columns, 
  data = [], 
  loading = false, 
  onRowClick,
  searchPlaceholder = "Search...",
  searchKey
}) => {
  const [sortConfig, setSortConfig] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // 1. Search filter
  const filteredData = React.useMemo(() => {
    if (!searchQuery || !searchKey) return data;
    return data.filter(item => {
      const val = item[searchKey];
      if (val === undefined || val === null) return false;
      return String(val).toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [data, searchQuery, searchKey]);

  // 2. Sort
  const sortedData = React.useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
        // Handle nested paths like object.sub
        if (sortConfig.key.includes(".")) {
          const parts = sortConfig.key.split(".");
          valA = parts.reduce((acc, curr) => acc?.[curr], a);
          valB = parts.reduce((acc, curr) => acc?.[curr], b);
        }

        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        if (valA < valB) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  // 3. Paginate
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Retrieving data..." />;
  }

  if (!loading && data.length === 0) {
    return <EmptyState title="No Records Found" subtitle="There are currently no items available to display." />;
  }

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Search & Actions Bar */}
      {searchKey && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <input
            type="text"
            className="w-full sm:max-w-xs px-4 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/40 rounded-button text-sm focus:outline-none focus:border-secondary transition-colors"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
          <div className="text-xs text-on-primary-container/60 font-mono">
            Showing {paginatedData.length} of {sortedData.length} records
          </div>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-card border border-on-primary-fixed-variant bg-primary-container/40 backdrop-blur-md">
        <table className="min-w-full divide-y divide-outline-variant/15 text-left text-sm text-on-primary-container">
          <thead className="bg-primary-container/80 uppercase text-xs font-semibold tracking-wider text-on-primary-container/60 font-sans">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={`px-6 py-4 ${col.sortable !== false ? "cursor-pointer select-none hover:text-secondary" : ""} transition-colors`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{col.header}</span>
                    {sortConfig?.key === col.key && (
                      sortConfig.direction === "ascending" ? <ChevronUp className="h-4 w-4 text-secondary" /> : <ChevronDown className="h-4 w-4 text-secondary" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15 bg-transparent font-sans">
            {paginatedData.map((row, idx) => (
              <tr
                key={row.id || idx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors duration-150 ${onRowClick ? "cursor-pointer hover:bg-white/5" : ""}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 whitespace-nowrap text-on-primary-container/80">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card-List View */}
      <div className="block md:hidden space-y-4">
        {paginatedData.map((row, idx) => (
          <div
            key={row.id || idx}
            onClick={() => onRowClick && onRowClick(row)}
            className="glass-card gold-hover p-4 flex flex-col space-y-3 cursor-pointer"
          >
            {columns.map((col, cIdx) => {
              // Keep key columns visible
              if (cIdx === 0) {
                return (
                  <div key={col.key} className="flex justify-between items-center border-b border-on-primary-fixed-variant/60 pb-2">
                    <span className="font-bold text-white text-base">
                      {col.render ? col.render(row) : row[col.key]}
                    </span>
                  </div>
                );
              }
              return (
                <div key={col.key} className="flex justify-between text-xs">
                  <span className="text-on-primary-container/40 uppercase font-medium">{col.header}</span>
                  <span className="text-on-primary-container/95 font-semibold text-right">
                    {col.render ? col.render(row) : row[col.key]}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-on-primary-container/60">Rows per page:</span>
            <select
              className="px-2 py-1 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container text-xs rounded focus:outline-none"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {[5, 10, 25, 50].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded bg-primary-container border border-on-primary-fixed-variant text-on-primary-container disabled:opacity-40 disabled:hover:bg-primary-container hover:bg-on-primary-fixed-variant transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-on-primary-container/80 px-2 font-mono">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded bg-primary-container border border-on-primary-fixed-variant text-on-primary-container disabled:opacity-40 disabled:hover:bg-primary-container hover:bg-on-primary-fixed-variant transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
