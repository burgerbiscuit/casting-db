'use client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { Upload } from 'lucide-react'

interface MediaUploaderProps {
  modelId: string
  onUploaded: () => void
}

export function MediaUploader({ modelId, onUploaded }: MediaUploaderProps) {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<string>('')

  const onDrop = useCallback(async (files: File[]) => {
    setUploading(true)
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setProgress(`Uploading ${i + 1} of ${files.length}...`)
      const ext = file.name.split('.').pop()
      const path = `${modelId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const type = file.type.startsWith('video') ? 'video' : 'photo'

      const { error } = await supabase.storage.from('model-media').upload(path, file)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('model-media').getPublicUrl(path)
        await supabase.from('model_media').insert({
          model_id: modelId,
          storage_path: path,
          public_url: publicUrl,
          type,
        })
      }
    }
    setUploading(false)
    setProgress('')
    onUploaded()
  }, [modelId, supabase, onUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
    multiple: true,
  })

  return (
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
  )
}
