import React, { useState } from 'react';
import '../../styles/Student.css';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Direct local storage se token fetch karna
      const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
      
      // Hardcoded base URL and dynamic Search Query (from your cURL request)
      const url = `https://jubilant-space-enigma-q7w67xpvgwpjh9ppg-5000.app.github.dev/api/Student/details/${encodeURIComponent(searchQuery.trim())}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const textData = await response.text();
      
      // Try to parse JSON for pretty display, fallback to plain text if it fails
      try {
        const jsonData = JSON.parse(textData);
        setResult(jsonData);
      } catch (jsonError) {
        setResult(textData);
      }

    } catch (err) {
      setError(err.message || 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-page">
      <div className="student-header">
        <h2>Raw API Search (Self-Contained)</h2>
      </div>
      
      <div className="student-form-container" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '15px', width: '100%', maxWidth: '600px', alignItems: 'center' }}>
          <input 
            type="text" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            placeholder="Enter VDL ID (e.g., VDL011)..." 
            style={{ flex: 1, padding: '12px 15px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px', outline: 'none' }}
            required
          />
          <button type="submit" className="btn-primary-action" style={{ width: 'auto', padding: '12px 25px', margin: 0, fontSize: '16px' }} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Display Section */}
        <div style={{ width: '100%', maxWidth: '800px', marginTop: '30px' }}>
          {error && (
            <div style={{ padding: '15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '6px', border: '1px solid #f5c6cb' }}>
              <strong>Warning:</strong> {error}
            </div>
          )}
          
          {result && (
            <div style={{ textAlign: 'left', background: '#2c3e50', color: '#ecf0f1', padding: '20px', borderRadius: '8px', overflowX: 'auto', border: '1px solid #34495e' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#3498db' }}>API Response:</h4>
              <pre style={{ margin: 0, fontSize: '14px', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                {typeof result === 'object' ? JSON.stringify(result, null, 2) : result}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;