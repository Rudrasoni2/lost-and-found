import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function ImageUpload({ images, setImages, maxFiles = 5 }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (images.length + acceptedFiles.length > maxFiles) {
      toast.error(`You can only upload up to ${maxFiles} images.`);
      return;
    }
    const newImages = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImages]);
  }, [images, setImages, maxFiles]);

  const removeImage = (index) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxSize: 10485760, // 10MB
  });

  return (
    <div className="space-y-4">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600 font-medium">Drag & drop photos here, or click to select</p>
        <p className="text-xs text-gray-500 mt-2">Max {maxFiles} images (up to 10MB each)</p>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((file, index) => (
            <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square">
              <img src={file.preview} alt={`preview ${index}`} className="w-full h-full object-cover" />
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                className="absolute top-1 right-1 bg-white/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-red-50 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
