import { useEffect, useState } from 'react'
import { signedPhotoUrl } from '../services/photoStorage'

export default function useSignedPhoto(path, fallback = '') {
  const [url, setUrl] = useState(fallback)

  useEffect(() => {
    let active = true
    setUrl(fallback)

    if (path) {
      signedPhotoUrl(path)
        .then((signedUrl) => {
          if (active && signedUrl) setUrl(signedUrl)
        })
        .catch(() => undefined)
    }

    return () => { active = false }
  }, [path, fallback])

  return url
}
