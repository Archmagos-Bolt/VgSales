import React from 'react';
import MainTable from './main-table';
import AddGameForm from './add-game-form';
//import axios from 'axios';

//axios.defaults.baseURL = 'http://backend:5000';

function App() {
  return (
    <div className="App">
      <AddGameForm />
      <MainTable />
    </div>
  );
}

export default App;