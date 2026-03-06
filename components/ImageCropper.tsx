'use client'
import { useState, useRef, useCallback } from 'react'
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

interface Props {
  src: string
  filename: string
  onDone: (blob: Blob, filename: string) => void
  onCancel: () => void
}

function centerAspectCrop(w: number, h: number, aspect: number) {
  return centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, w, h), w, h)
}

export function ImageCropper({ src, filename, onDone, onCancel }: Props) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [aspect, setAspect] = useState<number | undefined>(3/4)
  const [rotate, setRotate] = useState(0)
  const [scale, setScale] = useState(1)
  const [processing, setProcessing] = useState(false)

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    const initialCrop = centerAspectCrop(width, height, aspect ?? 3/4)
    setCrop(initialCrop)
    setCompletedCrop({ ...initialCrop, unit: 'px' } as PixelCrop)
  }

  const getCroppedBlob = useCallback(async () => {
    try {
      if (!imgRef.current || !completedCrop || completedCrop.width === 0 || completedCrop.height === 0) {
        console.warn('Crop missing:', { imgRef: !!imgRef.current, completedCrop })
        return null
      }
      const image = imgRef.current
      const canvas = document.createElement('canvas')
      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height
      canvas.width = Math.round(completedCrop.width * scaleX)
      canvas.height = Math.round(completedCrop.height * scaleY)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not get canvas context')
      
      // Simple crop - no rotate/scale transforms
      ctx.drawImage(
        image,
        Math.round(completedCrop.x * scaleX),
        Math.round(completedCrop.y * scaleY),
        Math.round(completedCrop.width * scaleX),
        Math.round(completedCrop.height * scaleY),
        0, 0,
        canvas.width,
        canvas.height
      )
      
      return new Promise<Blob | null>((resolve) => {
        try {
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob)
              else resolve(null)
            },
            'image/jpeg',
            0.95
          )
        } catch (e) {
          console.error('toBlob error:', e)
          resolve(null)
        }
      })
    } catch (e) {
      console.error('getCroppedBlob error:', e)
      return null
    }
  }, [completedCrop])

  const handleDone = async () => {
    try {
      setProcessing(true)
      const blob = await getCroppedBlob()
      console.log('Crop result:', { blob: blob?.size, completedCrop })
      if (blob) {
        console.log('Using cropped blob:', blob.size, 'bytes')
        onDone(blob, filename.replace(/\.[^.]+$/, '') + '_cropped.jpg')
      } else {
        console.log('Crop returned null, falling back to original')
        onDone(await fetch(src).then(r => r.blob()), filename)
      }
    } catch (e) {
      console.error('Crop error:', e)
      alert('Failed to crop image. Try refreshing and trying again.')
      setProcessing(false)
    }
  }

  const aspects = [
    { label: '3:4 Portrait', value: 3/4 },
    { label: '1:1 Square', value: 1 },
    { label: '4:5', value: 4/5 },
    { label: 'Free', value: undefined },
  ]

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <p className="text-xs tracking-widest uppercase">Edit Photo</p>
          <button onClick={onCancel} className="text-xs tracking-widest uppercase text-neutral-400 hover:text-black">Cancel</button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 px-6 py-3 border-b border-neutral-100">
          <div className="flex gap-2">
            {aspects.map(a => (
              <button key={a.label} onClick={() => {
                setAspect(a.value)
                if (imgRef.current && a.value) {
                  const { width, height } = imgRef.current
                  setCrop(centerAspectCrop(width, height, a.value))
                }
              }}
                className={`text-xs tracking-widest uppercase px-3 py-1.5 border transition-colors ${aspect === a.value ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
                {a.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 tracking-widest uppercase">Rotate</span>
              <button onClick={() => setRotate(r => r - 90)} className="text-xs border border-neutral-300 px-2 py-1 hover:border-black">↺</button>
              <button onClick={() => setRotate(r => r + 90)} className="text-xs border border-neutral-300 px-2 py-1 hover:border-black">↻</button>
            </div>
          </div>
        </div>

        {/* Crop area */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-neutral-50 min-h-0">
          <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)}
            aspect={aspect} minWidth={50} minHeight={50}>
            <img ref={imgRef} src={src} alt="Crop" onLoad={onImageLoad}
              style={{ transform: `rotate(${rotate}deg) scale(${scale})`, maxHeight: '50vh', maxWidth: '100%' }} />
          </ReactCrop>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-100">
          <button onClick={onCancel} disabled={processing} className="text-xs tracking-widest uppercase px-6 py-3 border border-neutral-300 hover:border-black disabled:opacity-50 disabled:cursor-not-allowed">
            Skip Crop
          </button>
          <button onClick={handleDone} disabled={processing} className="text-xs tracking-widest uppercase px-6 py-3 bg-black text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed">
            {processing ? 'Processing...' : 'Apply & Upload'}
          </button>
        </div>
      </div>
    </div>
  )
}
