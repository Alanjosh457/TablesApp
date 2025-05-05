import React from 'react';
import './App.css'; 
import UserList from './components/UserList';

const App = () => {
  return (
    <div className="App">
      <h1>Paginated Users App</h1>
      <UserList />
    </div>
  );
};

export default App;
