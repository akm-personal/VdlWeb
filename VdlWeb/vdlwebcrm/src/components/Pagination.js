import React from 'react';

const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange, onItemsPerPageChange }) => {
  const totalPages = itemsPerPage === 'All' ? 1 : Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = itemsPerPage === 'All' ? totalItems : currentPage * itemsPerPage;
  const indexOfFirstItem = itemsPerPage === 'All' ? 0 : indexOfLastItem - itemsPerPage;

  return (
    <div className="pagination-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', flexWrap: 'wrap', gap: '10px' }}>
      <div className="pagination-info" style={{ fontSize: '14px', color: '#555' }}>
        Showing {totalItems === 0 ? 0 : indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} entries
        <select value={itemsPerPage} onChange={onItemsPerPageChange} style={{ marginLeft: '10px', padding: '5px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer' }}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value="All">All</option>
        </select>
      </div>
      {itemsPerPage !== 'All' && totalPages > 1 && (
        <div className="pagination-controls" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <button type="button" onClick={() => onPageChange(Math.max(currentPage - 1, 1))} disabled={currentPage === 1} className="btn-primary-action" style={{ width: 'auto', padding: '5px 10px', margin: 0, backgroundColor: currentPage === 1 ? '#bdc3c7' : '#3498db' }}>Previous</button>
          <span style={{ padding: '5px 10px', fontSize: '14px', fontWeight: 'bold' }}>Page {currentPage} of {totalPages}</span>
          <button type="button" onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages} className="btn-primary-action" style={{ width: 'auto', padding: '5px 10px', margin: 0, backgroundColor: currentPage === totalPages ? '#bdc3c7' : '#3498db' }}>Next</button>
        </div>
      )}
    </div>
  );
};

export default Pagination;