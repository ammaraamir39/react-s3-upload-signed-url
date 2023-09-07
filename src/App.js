// src/App.js

import React from "react"
import "./App.css"
import Upload from "./components/Upload"

function App() {
  return (
    <div className="App">
      <h1>Multipart Upload to S3</h1>
      <Upload />
    </div>
  )
}

export default App
