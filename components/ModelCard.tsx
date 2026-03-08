'use client'
import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ModelCardProps {
  presentationModel: any
  model: any
  media: any[]
  presentationId: string
  clientId: string
  initialShortlisted: boolean
  onShortlistChange?: (v: boolean) => void
  initialNotes: string
  onCardClick?: () => void
}

export function ModelCard({ presentationModel, model, media, presentationId, clientId, initialShortlisted, initialNotes, onShortlistChange, onCardClick }: ModelCardProps) {
  const supabase = createClient()
  const [shortlisted, setShortlisted] = useState(initialShortlisted)
  const [notes, setNotes] = useState(initialNotes)
  const [mediaIndex, setMediaIndex] = useState(0)
  const [igData, setIgData] = useState<{ follower_count: number | null } | null>(null)

  const visibleMedia = media.filter(m => m.is_visible)

  useEffect(() => {
    if (presentationModel.show_instagram && model.instagram_handle) {
      fetch(`/api/instagram/${model.instagram_handle}`)
        .then(r => r.json())
        .then(d => setIgData(d))
        .catch(() => {})
    }
  }, [model.instagram_handle, presentationModel.show_instagram])

  const toggleShortlist = async () => {
    const next = !shortlisted
    setShortlisted(next); onShortlistChange?.(next)
    try {
      await fetch('/api/shortlist', {
        method: 'POST',
        body: JSON.stringify({
          action: 'toggle',
          presentationId,
          modelId: model.id,
          notes,
        }),
      })
    } catch (err) {
      console.error('Toggle shortlist failed:', err)
      setShortlisted(!next) // revert optimistic update
    }
  }

  const saveNotes = async (val: string) => {
    setNotes(val)
    if (shortlisted || val) {
      try {
        await fetch('/api/shortlist', {
          method: 'POST',
          body: JSON.stringify({
            action: 'updateNotes',
            presentationId,
            modelId: model.id,
            notes: val,
          }),
        })
      } catch (err) {
        console.error('Save notes failed:', err)
      }
    }
  }

  const formatFollowers = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return n.toString()
  }

  return (
    <div className="border border-neutral-200 flex flex-col">
      {/* Photos — click to open slides */}
      <div className="relative aspect-[3/4] bg-neutral-100 overflow-hidden cursor-pointer" onClick={onCardClick}>
        {visibleMedia.length > 0 ? (
          visibleMedia[mediaIndex]?.type === 'video' ? (
            <video src={visibleMedia[mediaIndex].public_url} className="w-full h-full object-cover" controls />
          ) : (
            <img src={visibleMedia[mediaIndex].public_url} alt={`${model.first_name} ${model.last_name}`} className="w-full h-full object-cover" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300 text-xs">No photo</div>
        )}

        <button
          onClick={e => { e.stopPropagation(); toggleShortlist() }}
          className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${shortlisted ? 'bg-black text-white' : 'bg-white/80 text-neutral-400 hover:text-black'}`}
        >
          <Heart size={14} fill={shortlisted ? 'white' : 'none'} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col" style={{height: "160px", overflow: "hidden"}}>
        <h3 className="text-sm font-medium tracking-widest uppercase mb-1 truncate">
          {model.first_name} {model.last_name}
        </h3>

        {presentationModel.show_sizing && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-2 text-xs text-neutral-600">
            {model.height_ft && <span>{model.height_ft}'{model.height_in}"</span>}
            {model.bust && <span>B {model.bust}</span>}
            {model.waist && <span>W {model.waist}</span>}
            {model.hips && <span>H {model.hips}</span>}
            {model.shoe_size && <span>Shoe {model.shoe_size}</span>}
            {model.dress_size && <span>Dress {model.dress_size}</span>}
          </div>
        )}

        {presentationModel.show_instagram && model.instagram_handle && (
          <div className="text-xs text-neutral-700 mb-2">
            {(() => {
              // Clean Instagram handle: remove leading @ symbols
              const cleanHandle = model.instagram_handle.replace(/^@+/, '');
              return (
                <>
                  <a href={`https://instagram.com/${cleanHandle}`} target="_blank" rel="noopener noreferrer"
                    className="hover:text-black underline">@{cleanHandle}</a>
                  {igData?.follower_count && <span className="ml-1 text-neutral-400">· {formatFollowers(igData.follower_count)} followers</span>}
                </>
              );
            })()}
          </div>
        )}

        {presentationModel.show_portfolio && model.portfolio_url && (
          <a href={model.portfolio_url.startsWith('http') ? model.portfolio_url : `https://${model.portfolio_url}`} target="_blank" rel="noopener noreferrer"
            className="text-xs text-neutral-600 hover:text-black underline block mb-3 truncate">
            Portfolio ↗
          </a>
        )}

        {(presentationModel.rate?.trim() || presentationModel.location?.trim() || presentationModel.admin_notes?.trim()) && (
          <div className="text-[10px] text-neutral-600 space-y-0.5 mb-1 border-t border-neutral-100 pt-2 mt-1">
            {presentationModel.rate?.trim() && <p><span className="text-neutral-400 uppercase tracking-wider text-[9px]">Rate </span>{presentationModel.rate}</p>}
            {presentationModel.admin_notes?.trim() && <p><span className="text-neutral-400 uppercase tracking-wider text-[9px]">Option </span>{presentationModel.admin_notes}</p>}
            {presentationModel.location?.trim() && <p><span className="text-neutral-400 uppercase tracking-wider text-[9px]">Location </span>{presentationModel.location}</p>}
          </div>
        )}


      </div>
    </div>
  )
}
