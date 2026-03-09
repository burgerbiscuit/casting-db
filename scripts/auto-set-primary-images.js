#!/usr/bin/env node
/**
 * Auto-set primary (PDF 1) image for all models missing one
 * 
 * For each model with visible media but no is_pdf_primary=true:
 * - Find the oldest visible image (by uploaded_at)
 * - Set it as is_pdf_primary=true
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://yayrsksrgrsjxcewwwlg.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'

const svc = createClient(supabaseUrl, serviceRoleKey)

async function fixPrimaryImages() {
  console.log('Finding models with visible media but no primary image...')
  
  // Get all media without a primary
  const { data: allMedia, error: mediaError } = await svc
    .from('model_media')
    .select('id, model_id')
    .eq('is_visible', true)
  
  if (mediaError) {
    console.error('Error fetching media:', mediaError)
    return
  }
  
  // Get all models with primary images
  const { data: hasPrimary, error: primaryError } = await svc
    .from('model_media')
    .select('model_id')
    .eq('is_pdf_primary', true)
  
  if (primaryError) {
    console.error('Error fetching primary media:', primaryError)
    return
  }
  
  // Find model IDs with visible media but no primary
  const modelIdsWithPrimary = new Set(hasPrimary?.map(m => m.model_id) || [])
  const modelIdsWithMedia = new Set(allMedia?.map(m => m.model_id) || [])
  
  const needsFixing = Array.from(modelIdsWithMedia).filter(id => !modelIdsWithPrimary.has(id))
  
  if (!needsFixing.length) {
    console.log('No models need fixing!')
    return
  }
  
  // Get model details for display
  const { data: modelDetails } = await svc
    .from('models')
    .select('id, first_name, last_name')
    .in('id', needsFixing)
  
  console.log(`Found ${needsFixing.length} models needing fixes\n`)
  
  let fixed = 0
  let failed = 0
  
  for (const model of (modelDetails || [])) {
    // Get the oldest visible image for this model
    const { data: mediaList, error: mediaError } = await svc
      .from('model_media')
      .select('id, uploaded_at, public_url')
      .eq('model_id', model.id)
      .eq('is_visible', true)
      .order('uploaded_at', { ascending: true })
      .limit(1)
    
    if (mediaError || !mediaList?.length) {
      console.log(`❌ ${model.first_name} ${model.last_name} (${model.id}): No visible media found`)
      failed++
      continue
    }
    
    const targetMedia = mediaList[0]
    const { error: updateError } = await svc
      .from('model_media')
      .update({ is_pdf_primary: true })
      .eq('id', targetMedia.id)
    
    if (updateError) {
      console.log(`❌ ${model.first_name} ${model.last_name}: Update failed: ${updateError.message}`)
      failed++
    } else {
      console.log(`✅ ${model.first_name} ${model.last_name}`)
      fixed++
    }
  }
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`RESULTS: ${fixed} fixed, ${failed} failed`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`Icons should now load on /admin/models page.`)
}

fixPrimaryImages().catch(console.error)
