'use client'
import { useState, useRef } from 'react'
import { Upload, X, FileText, Image, Presentation } from 'lucide-react'

type ProjectFile = {
  id: string
  name: string
  storage_path: string
  public_url: string
  file_type: string
  created_at: string
}

export default function ProjectFilesTab({ projectId, initialFiles }: { projectId: string, initialFiles: ProjectFile[] }) {
  const [files, setFiles] = useState<ProjectFile[]>(initialFiles)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = async (fileList: FileList) => {
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('projectId', projectId)
      Array.from(fileList).forEach(f => fd.append('files', f))

      const res = await fetch('/api/project-files', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      if (data.files?.length) setFiles(prev => [...prev, ...data.files])
      if (data.files?.length < fileList.length) setError('Some files failed to upload.')
    } catch (e: any) {
      setError(e.message || 'Upload failed')
    }
    setUploading(false)
  }

  const remove = async (f: ProjectFile) => {
    setFiles(prev => prev.filter(x => x.id !== f.id)) // optimistic
    try {
      await fetch('/api/project-files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: f.id, storagePath: f.storage_path }),
      })
    } catch (e) {
      setFiles(prev => [...prev, f]) // revert on error
    }
  }

  const icon = (type: string) => {
    if (type?.startsWith('image/')) return <Image size={16} className="text-neutral-400" />
    if (type?.includes('presentation') || type?.includes('powerpoint')) return <Presentation size={16} className="text-neutral-400" />
    return <FileText size={16} className="text-neutral-400" />
  }

  return (
    <div>
      {/* Upload zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); if (e.dataTransfer.files.length) upload(e.dataTransfer.files) }}
        className="border-2 border-dashed border-neutral-200 rounded p-8 text-center cursor-pointer hover:border-black transition-colors mb-6">
        <Upload size={20} className="mx-auto mb-2 text-neutral-300" />
        <p className="text-xs text-neutral-400 tracking-wide">
          {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
        </p>
        <p className="text-[10px] text-neutral-300 mt-1">Images, PDFs, presentations — anything your team needs</p>
        <input ref={inputRef} type="file" multiple className="hidden"
          accept="image/*,.pdf,.ppt,.pptx,.key,.doc,.docx"
          onChange={e => e.target.files && upload(e.target.files)} />
      </div>

      {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

      {files.length === 0 ? (
        <p className="text-xs text-neutral-400 text-center py-8">No files uploaded yet</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {files.map(f => (
            <div key={f.id} className="border border-neutral-100 group relative overflow-hidden">
              {f.file_type?.startsWith('image/') ? (
                <a href={f.public_url} target="_blank" rel="noopener noreferrer">
                  <img src={f.public_url} alt={f.name} className="w-full aspect-square object-cover" />
                </a>
              ) : (
                <a href={f.public_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center aspect-square bg-neutral-50 hover:bg-neutral-100 transition-colors">
                  {icon(f.file_type)}
                </a>
              )}
              <div className="p-2 border-t border-neutral-100 flex items-center gap-2">
                <p className="text-[10px] text-neutral-600 truncate flex-1">{f.name}</p>
                <button onClick={() => remove(f)} className="text-neutral-300 hover:text-red-500 transition-colors flex-shrink-0">
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
