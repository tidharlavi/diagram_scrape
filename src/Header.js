import React from 'react';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <div>
      <h1 className={headerStyle}>Diagram Search</h1>
      <Link to="/" className={linkStyle}>All Diagrams</Link>
      <Link to="/myposts" className={linkStyle}>My Daigrams</Link>
    </div>
  )
}

const headerContainer = css`
  padding-top: 20px;
`

const headerStyle = css`
  font-size: 40px;
`

const linkStyle = css`
  font-weight: bold;
  text-decoration: none;
  margin-right: 10px;
  :hover {
    color: #058aff;
  }
`

