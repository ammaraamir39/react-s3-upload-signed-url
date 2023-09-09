// src/components/Upload.js

import React, { useState } from "react"
import { getSignedUrls, completeMultipartUpload } from "../api"

const Upload = () => {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const uploadFile = async () => {
    if (!file) return
    console.log("File = > ", file)
    setLoading(true)
    setError(null)

    try {
      const partSize = 5 * 1024 * 1024 // Adjust based on your requirements
      const type = "avatar" // or "avatar"
      const fileName = file.name
      const fileSize = file.size
      const channelGroupName = null // Adjust as necessary
      const channelName = null // Adjust as necessary

      const {
        data: { uploadType, uploadId, signedUrls, signedUrl, key }
      } = await getSignedUrls(
        type,
        fileName,
        fileSize,
        channelGroupName,
        channelName
      )
      console.log("Front Response Get Signed Url = >", {
        uploadType,
        uploadId,
        signedUrls,
        signedUrl,
        key
      })
      if (uploadType === "direct") {
        const uploadResponse = await fetch(signedUrl, {
          method: "PUT",
          headers: {
            "x-amz-acl": "public-read"
          },
          body: file
        })
        console.log("Upload Direct Response SIgned Url = > ", uploadResponse)
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file")
        }

        console.log("Direct upload successful")
        return
      }

      if (uploadType !== "multipart") {
        throw new Error("Unexpected upload type")
      }

      const parts = Math.ceil(file.size / partSize)
      console.log("parts = > ", parts)
      const uploadedParts = []

      for (let i = 0; i < signedUrls.length; i++) {
        const { part, url: signedUrl } = signedUrls[i]

        const start = part * partSize
        console.log("Start = >", start)
        const end = Math.min((part + 1) * partSize, file.size)
        console.log("End = >", end)
        const chunk = file.slice(start, end)
        console.log("Chunk = >", chunk``)
        const uploadResponse = await fetch(signedUrl, {
          method: "PUT",
          headers: {
            "x-amz-acl": "public-read"
          },
          body: chunk
        })
        console.log(`Upload Response - part ${i + 1} => `, uploadResponse)
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload part")
        }

        uploadedParts.push({
          ETag: uploadResponse.headers.get("ETag"),
          PartNumber: part
        })
      }
      console.log("UploadedParts =>", uploadedParts)
      const uploadData = { parts: uploadedParts, uploadId, fileName, key }
      const completeResponse = await completeMultipartUpload(uploadData)

      console.log("Upload complete:", completeResponse)
    } catch (err) {
      console.error("Upload failed:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={uploadFile} disabled={loading}>
        Upload
      </button>
      {loading && <p>Uploading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  )
}

export default Upload
