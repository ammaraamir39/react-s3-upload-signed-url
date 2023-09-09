// src/api.js
const api_url = "http://localhost:3000/api/v1"
export const getSignedUrls = async (
  type,
  fileName,
  fileSize,
  channelGroupName,
  channelName
) => {
  let url = `${api_url}/s3/uploadFile?type=${type}&fileName=${fileName}&fileSize=${fileSize}`

  if (channelGroupName) {
    url += `&channelGroupName=${channelGroupName}`
  }
  if (channelName) {
    url += `&channelName=${channelName}`
  }

  const response = await fetch(url)
  console.log("Get Signed Url response = > ", response)
  const result = await response.json()
  console.log("Json Response = > ", result)
  if (!response.ok) {
    throw new Error(result.message || "Failed to get signed URLs")
  }

  return result
}

export const completeMultipartUpload = async (uploadData) => {
  const response = await fetch(`${api_url}/s3/completeUpload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(uploadData)
  })
  console.log("Complete MultiPart Response = >", response)
  if (!response.ok) {
    throw new Error("Failed to complete upload")
  }

  return response.json()
}
