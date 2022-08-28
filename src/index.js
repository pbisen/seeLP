import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import Dashboard from './Dashboard'
import './index.css'
import { ApolloProvider } from 'react-apollo'
import { client } from './TableComponent'
import {Link, BrowserRouter as Router, Route, Routes} from 'react-router-dom'

ReactDOM.render(
  <ApolloProvider client={client}>
    <>
    <Router>
      <Routes>
      <Route exact path="/" element={<App />} />
      <Route path="dashboard" element={<Dashboard />} >
        <Route path=":id" element={<Dashboard />}  />
        </Route>
      </Routes>
    </Router>
    </>
  </ApolloProvider>,
  document.getElementById('root')
)