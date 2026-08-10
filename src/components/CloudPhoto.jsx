import useSignedPhoto from '../hooks/useSignedPhoto'

const PHOTO_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"%3E%3Crect width="800" height="600" fill="%23f3e7d8"/%3E%3Cpath d="M0 470l190-170 120 105 120-120 370 315H0z" fill="%23dec8ba"/%3E%3Ccircle cx="610" cy="170" r="55" fill="%23d9939b" opacity=".55"/%3E%3C/svg%3E'

export default function CloudPhoto({ path, fallback, alt, ...props }) {
  const url = useSignedPhoto(path, fallback)
  return <img src={url || PHOTO_PLACEHOLDER} alt={alt} {...props} />
}
