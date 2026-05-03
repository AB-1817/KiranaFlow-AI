/**
 * Reusable upload card component
 * TODO: Add drag-and-drop functionality
 * TODO: Add file validation
 * TODO: Add upload progress indicator
 */

interface UploadCardProps {
  title: string
  description: string
  onUpload: (file: File) => void
}

export default function UploadCard({ title, description, onUpload }: UploadCardProps) {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 transition-colors">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <input
        type="file"
        className="hidden"
        id={`upload-${title}`}
        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
      />
      <label
        htmlFor={`upload-${title}`}
        className="inline-block px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700"
      >
        Choose File
      </label>
    </div>
  )
}
