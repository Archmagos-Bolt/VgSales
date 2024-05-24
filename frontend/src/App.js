import React from 'react';
import MainTable from './main-table';
import AddGameForm from './add-game-form';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';

axios.defaults.baseURL = 'http://backend:5000';

function App() {
  return (
    <BrowserRouter>
    <div className="App">
      <AddGameForm />
      <MainTable />
    </div>
    </BrowserRouter>
  );
}

export default App;