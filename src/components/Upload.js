// src/components/Upload.js

import React, { useState } from "react"
import { getSignedUrls, completeMultipartUpload } from "../api"
const MAX_RETRIES = 3 // Max number of retries
const RETRY_DELAY = 5000 // Delay (in milliseconds) between retries
const Upload = () => {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  const uploadFile = async () => {
    if (!file) return
    console.log("File = > ", file)
    setLoading(true)
    setError(null)

    try {
      const partSize = 500 * 1024 * 1024 // Adjust based on your requirements
      const type = "chat" // or "avatar"
      const fileName = file.name
      const fileSize = file.size
      const channelGroupName = "Group" // Adjust as necessary
      const channelName = "Channel" // Adjust as necessary

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
        console.log("inside for loop part and url = > ", { part, signedUrl })
        const start = (part - 1) * partSize
        console.log("Start = >", start)
        const end = Math.min((part + 1) * partSize, file.size)
        console.log("End = >", end)
        const chunk = file.slice(start, end)
        console.log("Chunk = >", chunk)
        const uploadResponse = await fetch(signedUrl, {
          method: "PUT",
          body: chunk
        })
        console.log(`Upload Response - part ${i + 1} => `, uploadResponse)
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload part")
        }
        console.log("upload Response headers = > ", uploadResponse.headers)
        console.log(
          "upload Response headers Etag= > ",
          uploadResponse.headers.get("ETag")
        )
        uploadedParts.push({
          ETag: uploadResponse.headers.get("ETag"),
          PartNumber: part
        })
      }
      console.log("UploadedParts =>", uploadedParts)
      const uploadData = { parts: uploadedParts, uploadId, fileName, key }
      console.log("Uploaded Data =>", uploadData)
      let retries = 0
      while (retries < MAX_RETRIES) {
        try {
          console.log(
            `Attempting to complete multipart upload. Try ${retries + 1}`
          )
          const completeResponse = await completeMultipartUpload(uploadData)
          console.log("Upload complete:", completeResponse)
          break // Exit the loop if upload is successful
        } catch (err) {
          console.error(
            `Complete multipart upload failed on try ${retries + 1}:`,
            err
          )
          retries++

          if (retries < MAX_RETRIES) {
            console.log(`Retrying in ${RETRY_DELAY}ms...`)
            await delay(RETRY_DELAY)
          } else {
            console.error("Max retries reached. Upload failed:", err)
            setError(err.message)
          }
        }
      }
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
