'use client'

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

const ACCEPT = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt'

function FileIcon({ type }) {
  if (type?.startsWith('image/')) return '🖼'
  if (type === 'application/pdf') return '📋'
  if (type?.includes('word')) return '📝'
  if (type?.includes('excel') || type?.includes('spreadsheet')) return '📊'
  return '📄'
}

const FileAttachments = forwardRef(function FileAttachments({ recordType, recordId }, ref) {
  const [docs, setDocs] = useState([])
  const [pendingFiles, setPendingFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef()

  const isExisting = recordId && recordId !== 'new' && recordId !== null

  // Called by parent after a new record is created to upload queued files
  useImperativeHandle(ref, () => ({
    async flush(newRecordId) {
      if (!pendingFiles.length) return
      setUploading(true)
      setError('')
      try {
        for (const file of pendingFiles) {
          const fd = new FormData()
          fd.append('file', file)
          fd.append('recordType', recordType)
          fd.append('recordId', newRecordId)
          const res = await fetch('/api/upload', { method: 'POST', body: fd })
          if (!res.ok) {
            const data = await res.json()
            throw new Error(data.error || 'Upload failed')
          }
        }
        setPendingFiles([])
      } catch (err) {
        setError(err.message || 'Upload failed.')
      } finally {
        setUploading(false)
      }
    }
  }))

  useEffect(() => {
    if (isExisting) load()
  }, [recordId])

  async function load() {
    try {
      const res = await fetch(`/api/documents?type=${recordType}&recordId=${recordId}`)
      if (res.ok) setDocs(await res.json())
    } catch {}
  }

  async function handleFiles(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return

    if (!isExisting) {
      // Queue files locally — will be uploaded after record is saved
      setPendingFiles(prev => [...prev, ...files])
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    setUploading(true)
    setError('')
    try {
      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('recordType', recordType)
        fd.append('recordId', recordId)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Upload failed')
        }
      }
      await load()
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function remove(id) {
    if (!confirm('Remove this attachment?')) return
    await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    setDocs(d => d.filter(doc => doc.id !== id))
  }

  function removePending(index) {
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Attachments</h2>
        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-700 transition-colors">
          {uploading ? 'Uploading…' : '+ Add Files'}
          <input ref={inputRef} type="file" multiple className="hidden"
            onChange={handleFiles} accept={ACCEPT} disabled={uploading} />
        </label>
      </div>

      {error && (
        <p className="text-xs text-red-600 mb-3 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}

      {/* Pending files queued before record is saved */}
      {!isExisting && pendingFiles.length > 0 && (
        <>
          <p className="text-xs text-amber-600 mb-3">⏳ {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''} queued — will upload when record is saved.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {pendingFiles.map((file, i) => (
              <div key={i} className="relative group border border-dashed border-amber-300 rounded-lg overflow-hidden bg-amber-50">
                {file.type?.startsWith('image/') ? (
                  <img src={URL.createObjectURL(file)} alt={file.name}
                    className="w-full h-28 object-cover opacity-80" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-28 text-gray-500 gap-1">
                    <span className="text-3xl"><FileIcon type={file.type} /></span>
                    <span className="text-xs text-center px-2 w-full truncate">{file.name}</span>
                  </div>
                )}
                {file.type?.startsWith('image/') && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                    {file.name}
                  </div>
                )}
                <button type="button" onClick={() => removePending(i)}
                  title="Remove"
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-800">
                  ×
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {!isExisting && pendingFiles.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">No attachments added yet.</p>
      )}

      {isExisting && docs.length === 0 && !uploading && (
        <p className="text-sm text-gray-400 text-center py-4">No attachments yet.</p>
      )}

      {isExisting && docs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {docs.map(doc => (
            <div key={doc.id} className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              {doc.fileType?.startsWith('image/') ? (
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                  <img src={doc.fileUrl} alt={doc.originalName}
                    className="w-full h-28 object-cover hover:opacity-90 transition-opacity" />
                </a>
              ) : (
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center h-28 text-gray-500 hover:text-red-700 transition-colors gap-1">
                  <span className="text-3xl"><FileIcon type={doc.fileType} /></span>
                  <span className="text-xs text-center px-2 w-full truncate text-center">
                    {doc.originalName}
                  </span>
                </a>
              )}
              {doc.fileType?.startsWith('image/') && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                  {doc.originalName}
                </div>
              )}
              <button onClick={() => remove(doc.id)}
                title="Remove attachment"
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-800">
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
          <span className="animate-spin">⏳</span> Uploading files…
        </div>
      )}
    </section>
  )
})

export default FileAttachments
