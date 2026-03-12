'use client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload } from 'lucide-react'
import { ImageCropper } from './ImageCropper'
import { createClient } from '@/lib/supabase/client'

interface MediaUploaderProps {
  modelId: string
  onUploaded: () => void
  mediaType?: 'photo' | 'video' | 'digital'
}

interface PendingFile {
  src: string
  filename: string
  originalFile: File
}

export function MediaUploader({ modelId, onUploaded, mediaType }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<string>('')
  const [cropQueue, setCropQueue] = useState<PendingFile[]>([])
  const [pendingUploads, setPendingUploads] = useState<{ blob: Blob, filename: string }[]>([])

  const uploadBlob = async (blob: Blob, filename: string, index: number, total: number) => {
    setProgress(`Uploading ${index + 1} of ${total}...`)
    const type = mediaType || (blob.type.startsWith('video/') ? 'video' : 'photo')
    const isVideo = blob.type.startsWith('video/')

    if (isVideo) {
      // Upload video directly to Supabase storage (bypasses Vercel 4.5MB limit)
      const supabase = createClient()
      const ext = filename.split('.').pop()?.toLowerCase() || 'mp4'
      const path = `${modelId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from('model-media').upload(path, blob, { contentType: blob.type })
      if (upErr) { console.error('Video upload error:', upErr.message); setProgress('Upload failed — ' + upErr.message); return }
      const { data: { publicUrl } } = supabase.storage.from('model-media').getPublicUrl(path)
      // Create the DB record via API (uses service client — bypasses any RLS edge cases)
      const res = await fetch('/api/model-media-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, storagePath: path, publicUrl, type: 'video' }),
      })
      if (!res.ok) { console.error('Video DB register failed:', await res.text()); setProgress('Upload failed — could not save to database'); return }
    } else {
      // Photos go through API (crop flow)
      const fd = new FormData()
      fd.append('modelId', modelId)
      fd.append('mediaType', type)
      fd.append('file', new File([blob], filename, { type: blob.type }))
      await fetch('/api/model-media-upload', { method: 'POST', body: fd })
    }
  }

  const onDrop = useCallback(async (files: File[]) => {
    const images = files.filter(f => f.type.startsWith('image/'))
    const videos = files.filter(f => f.type.startsWith('video/'))

    // Upload videos directly (no crop)
    if (videos.length > 0) {
      setUploading(true)
      for (let i = 0; i < videos.length; i++) {
        await uploadBlob(videos[i], videos[i].name, i, videos.length)
      }
      setUploading(false)
      setProgress('')
      if (images.length === 0) { onUploaded(); return }
    }

    // Queue images for cropping
    if (images.length > 0) {
      const queue: PendingFile[] = images.map(f => ({
        src: URL.createObjectURL(f),
        filename: f.name,
        originalFile: f,
      }))
      setCropQueue(queue)
      setPendingUploads([])
    }
  }, [modelId, onUploaded])

  const handleCropDone = async (blob: Blob, filename: string) => {
    const remaining = cropQueue.slice(1)
    const newPending = [...pendingUploads, { blob, filename }]

    if (remaining.length === 0) {
      // All cropped — upload everything
      setCropQueue([])
      setPendingUploads([])
      setUploading(true)
      for (let i = 0; i < newPending.length; i++) {
        await uploadBlob(newPending[i].blob, newPending[i].filename, i, newPending.length)
      }
      setUploading(false)
      setProgress('')
      onUploaded()
    } else {
      setPendingUploads(newPending)
      setCropQueue(remaining)
    }
  }

  const handleCropCancel = () => {
    // Skip crop for current, use original
    const current = cropQueue[0]
    current.originalFile.arrayBuffer().then(buf => {
      handleCropDone(new Blob([buf], { type: current.originalFile.type }), current.filename)
    })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: mediaType === 'video'
      ? { 'video/*': [] }
      : mediaType === 'digital'
      ? { 'image/*': [] }
      : { 'image/*': [], 'video/*': [] },
    multiple: true,
  })

  return (
    <>
      {cropQueue.length > 0 && (
        <ImageCropper
          src={cropQueue[0].src}
          filename={cropQueue[0].filename}
          onDone={handleCropDone}
          onCancel={handleCropCancel}
        />
      )}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'}`}
      >
        <input {...getInputProps()} />
        <Upload size={20} className="mx-auto mb-3 text-neutral-400" />
        {uploading ? (
          <p className="text-xs text-neutral-500">{progress}</p>
        ) : (
          <>
            <p className="text-xs text-neutral-500">Drag photos & videos here, or click to browse</p>
            <p className="text-xs text-neutral-300 mt-1">JPG, PNG, GIF, MP4, MOV</p>
          </>
        )}
      </div>
    </>
  )
}
