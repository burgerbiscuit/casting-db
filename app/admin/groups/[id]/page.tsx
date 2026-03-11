'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChipInput } from '@/components/ChipInput'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import { Eye, EyeOff, Star, Trash2, Upload } from 'lucide-react'
import Link from 'next/link'
import { useDropzone } from 'react-dropzone'

const GROUP_TYPES = ['Dance', 'Music', 'Sports', 'Acrobatics', 'Comedy', 'Cheer', 'Theater', 'Other']

export default function GroupProfilePage({ params }: { params: { id: string } }) {
  const { id } = params
  const supabase = createClient()
  const router = useRouter()
  const [group, setGroup] = useState<any>(null)
  const [media, setMedia] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'media'>('profile')
  const [showDelete, setShowDelete] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [deleteMediaTarget, setDeleteMediaTarget] = useState<any>(null)

  const loadGroup = useCallback(async () => {
    const { data } = await supabase.from('groups').select('*').eq('id', id).single()
    setGroup(data)
  }, [id])

  const loadMedia = useCallback(async () => {
    const { data } = await supabase.from('group_media').select('*').eq('group_id', id).order('display_order').order('created_at')
    setMedia(data || [])
  }, [id])

  useEffect(() => { loadGroup(); loadMedia() }, [loadGroup, loadMedia])

  const save = async () => {
    setSaving(true)
    await supabase.from('groups').update({ ...group, updated_at: new Date().toISOString() }).eq('id', id)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const deleteGroup = async () => {
    await supabase.from('groups').delete().eq('id', id)
    router.push('/admin/groups')
  }

  const toggleVisibility = async (mediaId: string, current: boolean) => {
    await supabase.from('group_media').update({ is_visible: !current }).eq('id', mediaId)
    loadMedia()
  }

  const setCover = async (mediaId: string) => {
    await supabase.from('group_media').update({ is_cover: false }).eq('group_id', id)
    await supabase.from('group_media').update({ is_cover: true }).eq('id', mediaId)
    loadMedia()
  }

  const deleteMedia = async (item: any) => {
    await fetch('/api/group-media-upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaId: item.id, storagePath: item.storage_path }),
    })
    loadMedia()
    setDeleteMediaTarget(null)
  }

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return
    setUploading(true)
    for (let i = 0; i < files.length; i++) {
      setUploadProgress(`Uploading ${i + 1} of ${files.length}...`)
      const fd = new FormData()
      fd.append('groupId', id)
      fd.append('mediaType', files[i].type.startsWith('video/') ? 'video' : 'photo')
      fd.append('file', files[i])
      await fetch('/api/group-media-upload', { method: 'POST', body: fd })
    }
    setUploading(false)
    setUploadProgress('')
    loadMedia()
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [], 'video/*': [] },
    onDrop: uploadFiles,
  })

  if (!group) return <div className="text-xs text-neutral-400 p-8">Loading...</div>

  const Field = ({ label, k, type = 'text', placeholder = '' }: { label: string; k: string; type?: string; placeholder?: string }) => (
    <div>
      <label className="label text-[10px] block mb-1">{label}</label>
      <input
        type={type}
        value={group[k] || ''}
        onChange={e => setGroup((g: any) => ({ ...g, [k]: e.target.value }))}
        placeholder={placeholder}
        className="w-full border-b border-neutral-200 bg-transparent py-1.5 text-sm focus:outline-none focus:border-black placeholder:text-neutral-300"
      />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link href="/admin/groups" className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black transition-colors block mb-2">
            ← Groups
          </Link>
          <h1 className="text-2xl font-light tracking-widest uppercase">{group.name}</h1>
          {group.group_type && <p className="text-sm text-neutral-400 mt-1">{group.group_type}</p>}
        </div>
        <div className="flex items-center gap-3">
          {!group.reviewed && (
            <button
              onClick={() => { setGroup((g: any) => ({ ...g, reviewed: true })); setTimeout(save, 50) }}
              className="border border-amber-300 text-amber-600 px-4 py-2 text-xs tracking-widest uppercase hover:bg-amber-50 transition-colors">
              Mark Approved
            </button>
          )}
          {group.reviewed && (
            <span className="text-[10px] tracking-widest uppercase text-green-600 border border-green-200 px-3 py-1.5">✓ Approved</span>
          )}
          <button onClick={save} disabled={saving}
            className="bg-black text-white px-6 py-2 text-xs tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-50">
            {saved ? 'Saved ✓' : saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 mb-8">
        {(['profile', 'media'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-xs tracking-widest uppercase transition-colors border-b-2 -mb-[1px] ${activeTab === tab ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-black'}`}>
            {tab}
            {tab === 'media' && media.length > 0 && (
              <span className="ml-1.5 text-[9px] bg-neutral-200 text-neutral-600 px-1.5 py-0.5">{media.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl space-y-8">
          {/* Core info */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            <div className="col-span-2">
              <Field label="GROUP NAME" k="name" />
            </div>
            <div>
              <label className="label text-[10px] block mb-1">GROUP TYPE</label>
              <select
                value={group.group_type || ''}
                onChange={e => setGroup((g: any) => ({ ...g, group_type: e.target.value }))}
                className="w-full border-b border-neutral-200 bg-transparent py-1.5 text-sm focus:outline-none focus:border-black">
                <option value="">—</option>
                {GROUP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Field label="SIZE" k="size" placeholder="e.g. Duo, Trio, 4–6 people" />
            <Field label="BASED IN" k="based_in" placeholder="City" />
            <Field label="AGENCY / REP" k="agency" />
            <Field label="INSTAGRAM" k="instagram_handle" placeholder="@handle" />
            <Field label="WEBSITE" k="website" placeholder="https://" />
          </div>

          {/* Description */}
          <div>
            <label className="label text-[10px] block mb-1">DESCRIPTION / BIO</label>
            <textarea
              value={group.description || ''}
              onChange={e => setGroup((g: any) => ({ ...g, description: e.target.value }))}
              rows={4}
              placeholder="About the group, their style, background..."
              className="w-full border border-neutral-200 bg-transparent p-3 text-sm focus:outline-none focus:border-black resize-none placeholder:text-neutral-300"
            />
          </div>

          {/* Skills */}
          <div>
            <label className="label text-[10px] block mb-2">SKILLS / SPECIALTIES</label>
            <ChipInput
              value={group.skills || []}
              onChange={(val: string[]) => setGroup((g: any) => ({ ...g, skills: val }))}
              placeholder="Add skill..."
              suggestions={['Hip Hop', 'Ballet', 'Contemporary', 'Jazz', 'Tap', 'Acrobatics', 'Tumbling', 'Breakdancing', 'Ballroom', 'Latin', 'Aerial', 'Gymnastics', 'Cheer', 'Martial Arts', 'Parkour', 'Synchronized Swimming', 'Skating', 'Singing', 'Beatboxing', 'Drumline', 'Comedy', 'Improv', 'Stunt Work']}
            />
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[10px] tracking-widest uppercase text-neutral-400 mb-4 pb-2 border-b border-neutral-100">Contact</h3>
            <div className="grid grid-cols-3 gap-x-8 gap-y-5">
              <Field label="CONTACT NAME" k="contact_name" />
              <Field label="CONTACT EMAIL" k="contact_email" type="email" />
              <Field label="CONTACT PHONE" k="contact_phone" />
            </div>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="label text-[10px] block mb-1">INTERNAL NOTES</label>
            <textarea
              value={group.notes || ''}
              onChange={e => setGroup((g: any) => ({ ...g, notes: e.target.value }))}
              rows={3}
              placeholder="Internal notes, availability, rates..."
              className="w-full border border-neutral-200 bg-transparent p-3 text-sm focus:outline-none focus:border-black resize-none placeholder:text-neutral-300"
            />
          </div>

          {/* Reviewed toggle */}
          <div className="flex items-center gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!group.reviewed}
                onChange={e => setGroup((g: any) => ({ ...g, reviewed: e.target.checked }))}
                className="cursor-pointer"
              />
              <span className="text-xs tracking-widest uppercase">Mark as Reviewed / Approved</span>
            </label>
          </div>

          {/* Save + Delete */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
            <button onClick={() => setShowDelete(true)}
              className="text-[10px] tracking-widest uppercase text-red-400 hover:text-red-600 transition-colors">
              Delete Group
            </button>
            <button onClick={save} disabled={saving}
              className="bg-black text-white px-8 py-3 text-xs tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-50">
              {saved ? 'Saved ✓' : saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Media Tab */}
      {activeTab === 'media' && (
        <div>
          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-sm p-10 text-center cursor-pointer transition-colors mb-8 ${isDragActive ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'}`}>
            <input {...getInputProps()} />
            <Upload size={20} className="mx-auto mb-3 text-neutral-300" />
            {uploading ? (
              <p className="text-xs text-neutral-500">{uploadProgress}</p>
            ) : (
              <>
                <p className="text-xs tracking-widest uppercase text-neutral-400">Drop photos or videos here</p>
                <p className="text-[10px] text-neutral-300 mt-1">or click to browse</p>
              </>
            )}
          </div>

          {/* Media grid */}
          {media.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {media.map(item => (
                <div key={item.id} className="relative group">
                  <div className={`aspect-[3/4] overflow-hidden ${!item.is_visible ? 'opacity-40' : ''}`}>
                    {item.media_type === 'video' ? (
                      <video src={item.public_url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={item.public_url} alt="" className="w-full h-full object-cover object-top" />
                    )}
                  </div>

                  {/* Cover badge */}
                  {item.is_cover && (
                    <div className="absolute top-1 left-1 bg-black text-white text-[8px] tracking-widest px-1.5 py-0.5 uppercase">Cover</div>
                  )}

                  {/* Controls (hover) */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100">
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleVisibility(item.id, item.is_visible)}
                        title={item.is_visible ? 'Hide' : 'Show'}
                        className="bg-white p-1.5 hover:bg-neutral-100 transition-colors">
                        {item.is_visible ? <Eye size={11} /> : <EyeOff size={11} />}
                      </button>
                      <button
                        onClick={() => setCover(item.id)}
                        title="Set as cover"
                        className={`p-1.5 transition-colors ${item.is_cover ? 'bg-black text-white' : 'bg-white hover:bg-neutral-100'}`}>
                        <Star size={11} className={item.is_cover ? 'fill-white' : ''} />
                      </button>
                      <button
                        onClick={() => setDeleteMediaTarget(item)}
                        title="Delete"
                        className="bg-white p-1.5 hover:bg-red-50 hover:text-red-500 transition-colors">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {media.length === 0 && !uploading && (
            <p className="text-xs text-neutral-400 text-center py-10">No media uploaded yet</p>
          )}
        </div>
      )}

      {showDelete && (
        <DeleteConfirmModal
          title={`Delete ${group.name}?`}
          description="This group and all its media will be permanently deleted."
          onConfirm={deleteGroup}
          onCancel={() => setShowDelete(false)}
        />
      )}

      {deleteMediaTarget && (
        <DeleteConfirmModal
          title="Delete this photo?"
          description="This media will be permanently removed."
          onConfirm={() => deleteMedia(deleteMediaTarget)}
          onCancel={() => setDeleteMediaTarget(null)}
        />
      )}
    </div>
  )
}
