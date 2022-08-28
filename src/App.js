import React, { useEffect } from "react";
import "./App.css";
import {Outlet} from 'react-router-dom'
import TableComponent from "./TableComponent";




function App() {
  

  return (
    <div className="app-wrapper">
      <div className="header-wrapper">
        <h1>seeLP</h1>
      </div>
      <div className="body-wrapper">
      <div className="table-wrapper">
        <TableComponent />
      </div>
      </div>
      <div className="footer-wrapper"></div>
      
      <Outlet/>
    </div>
    
  );
}

export default App;
