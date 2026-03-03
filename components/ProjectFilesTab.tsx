'use client'
import { useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
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
  const inputRef = useRef<HTMLInputElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const upload = async (fileList: FileList) => {
    setUploading(true)
    for (const file of Array.from(fileList)) {
      const ext = file.name.split('.').pop() || ''
      const path = `project-files/${projectId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from('model-media').upload(path, file)
      if (upErr) { console.error(upErr); continue }
      const { data: { publicUrl } } = supabase.storage.from('model-media').getPublicUrl(path)
      const { data: record } = await supabase.from('project_files').insert({
        project_id: projectId,
        name: file.name,
        storage_path: path,
        public_url: publicUrl,
        file_type: file.type,
      }).select().single()
      if (record) setFiles(prev => [...prev, record])
    }
    setUploading(false)
  }

  const remove = async (f: ProjectFile) => {
    await supabase.storage.from('model-media').remove([f.storage_path])
    await supabase.from('project_files').delete().eq('id', f.id)
    setFiles(prev => prev.filter(x => x.id !== f.id))
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
