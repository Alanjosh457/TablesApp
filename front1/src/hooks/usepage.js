import { useState, useEffect } from 'react';
import { fetchUsers } from '../services/index.js';

export const usepage = () => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const limit = 50;




  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
  
    console.log(`Loading page: ${page}`);  // Debugging log to check the current page
    
    try {
      const { data, total } = await fetchUsers(page, limit);
      setUsers(prev => [...prev, ...data]);  // Add new users to the list
      if ((page * limit) >= total) setHasMore(false);  // Disable loading if no more users
      setPage(prev => prev + 1);  // Increment page number for next request
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  




  useEffect(() => {
    loadMore(); // load first page
  }, []);

  return { users, loadMore, hasMore, loading };
};
