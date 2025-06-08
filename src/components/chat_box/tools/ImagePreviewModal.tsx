import React from 'react'
import './ImagePreviewModal.css'

interface ImagePreviewModalProps {
    imageUrl: string
    isOpen: boolean
    onClose: () => void
}

function ImagePreviewModal({ imageUrl, isOpen, onClose }: ImagePreviewModalProps) {
    if (!isOpen) return null

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose()
        }
    }

    return (
        <div 
            className="image-preview-modal"
            onClick={handleBackdropClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            <div className="modal-content">
                <button className="close-btn" onClick={onClose}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path 
                            d="M18 6L6 18M6 6l12 12" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
                <div className="image-container">
                    <img 
                        src={imageUrl} 
                        alt="预览图片" 
                        className="preview-image"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            </div>
        </div>
    )
}

export default ImagePreviewModal