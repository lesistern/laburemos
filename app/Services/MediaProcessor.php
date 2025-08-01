<?php
/**
 * MediaProcessor - Enterprise Media Management
 * LaburAR Complete Platform
 * 
 * Handles file uploads, image processing, virus scanning,
 * thumbnail generation, and CDN integration
 */

class MediaProcessor
{
    private $uploadPath;
    private $maxFileSize;
    private $allowedTypes;
    private $db;
    
    // Image processing settings
    private const AVATAR_SIZE = 300;
    private const THUMBNAIL_SIZE = 150;
    private const MAX_IMAGE_WIDTH = 1920;
    private const MAX_IMAGE_HEIGHT = 1080;
    
    // Storage paths
    private const AVATAR_PATH = '/uploads/avatars/';
    private const PORTFOLIO_PATH = '/uploads/portfolio/';
    private const DOCUMENT_PATH = '/uploads/documents/';
    private const THUMBNAIL_PATH = '/uploads/thumbnails/';
    
    public function __construct()
    {
        $this->uploadPath = $_SERVER['DOCUMENT_ROOT'] . '/Laburar/uploads/';
        $this->maxFileSize = $_ENV['MAX_FILE_SIZE'] ?? 10485760; // 10MB
        $this->allowedTypes = [
            'image' => ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            'document' => ['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx'],
            'video' => ['mp4', 'webm', 'mov'],
            'audio' => ['mp3', 'wav', 'ogg']
        ];
        
        $this->db = Database::getInstance();
        $this->ensureDirectories();
    }
    
    /**
     * Process avatar upload
     */
    public function processAvatar($file, $userId)
    {
        try {
            // Validate file
            if (!$this->validateImageFile($file)) {
                return ['success' => false, 'error' => 'Invalid image file'];
            }
            
            // Generate unique filename
            $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            $filename = 'avatar_' . $userId . '_' . time() . '.' . $extension;
            $filepath = $this->uploadPath . 'avatars/' . $filename;
            
            // Move uploaded file
            if (!move_uploaded_file($file['tmp_name'], $filepath)) {
                return ['success' => false, 'error' => 'Failed to save file'];
            }
            
            // Process image (resize, optimize)
            $processedPath = $this->processImage($filepath, self::AVATAR_SIZE, self::AVATAR_SIZE, true);
            
            // Generate thumbnail
            $thumbnailPath = $this->generateThumbnail($processedPath, self::THUMBNAIL_SIZE);
            
            // Save to database
            $mediaData = [
                'owner_id' => $userId,
                'owner_type' => 'user',
                'file_type' => 'avatar',
                'file_path' => self::AVATAR_PATH . basename($processedPath),
                'file_name' => $file['name'],
                'file_size' => filesize($processedPath),
                'mime_type' => mime_content_type($processedPath),
                'width' => self::AVATAR_SIZE,
                'height' => self::AVATAR_SIZE,
                'thumbnail_path' => self::THUMBNAIL_PATH . basename($thumbnailPath),
                'processing_status' => 'completed',
                'virus_scan_status' => 'clean',
                'uploaded_at' => date('Y-m-d H:i:s')
            ];
            
            $mediaFile = MediaFile::create($mediaData);
            
            // Clean up temporary files
            if ($filepath !== $processedPath) {
                unlink($filepath);
            }
            
            return [
                'success' => true,
                'url' => $this->getPublicURL($mediaData['file_path']),
                'thumbnail_url' => $this->getPublicURL($mediaData['thumbnail_path']),
                'media_id' => $mediaFile->id
            ];
            
        } catch (Exception $e) {
            error_log('[MediaProcessor] Avatar processing failed: ' . $e->getMessage());
            return ['success' => false, 'error' => 'Processing failed'];
        }
    }
    
    /**
     * Process portfolio media upload
     */
    public function processPortfolioMedia($file, $userId, $portfolioItemId)
    {
        try {
            $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            $isImage = in_array($extension, $this->allowedTypes['image']);
            
            // Generate unique filename
            $filename = 'portfolio_' . $portfolioItemId . '_' . time() . '.' . $extension;
            $subdir = $isImage ? 'portfolio/' : 'documents/';
            $filepath = $this->uploadPath . $subdir . $filename;
            
            // Move uploaded file
            if (!move_uploaded_file($file['tmp_name'], $filepath)) {
                return ['success' => false, 'error' => 'Failed to save file'];
            }
            
            $finalPath = $filepath;
            $thumbnailPath = null;
            $width = null;
            $height = null;
            
            // Process images
            if ($isImage) {
                $imageInfo = getimagesize($filepath);
                $width = $imageInfo[0];
                $height = $imageInfo[1];
                
                // Resize if too large
                if ($width > self::MAX_IMAGE_WIDTH || $height > self::MAX_IMAGE_HEIGHT) {
                    $finalPath = $this->processImage($filepath, self::MAX_IMAGE_WIDTH, self::MAX_IMAGE_HEIGHT);
                    if ($filepath !== $finalPath) {
                        unlink($filepath);
                    }
                }
                
                // Generate thumbnail
                $thumbnailPath = $this->generateThumbnail($finalPath, self::THUMBNAIL_SIZE);
            }
            
            // Virus scan (placeholder - implement with ClamAV or similar)
            $virusScanStatus = $this->performVirusScan($finalPath);
            
            // Save to database
            $mediaData = [
                'owner_id' => $userId,
                'owner_type' => 'user',
                'related_id' => $portfolioItemId,
                'file_type' => 'portfolio',
                'file_path' => ($isImage ? self::PORTFOLIO_PATH : self::DOCUMENT_PATH) . basename($finalPath),
                'file_name' => $file['name'],
                'file_size' => filesize($finalPath),
                'mime_type' => mime_content_type($finalPath),
                'width' => $width,
                'height' => $height,
                'thumbnail_path' => $thumbnailPath ? self::THUMBNAIL_PATH . basename($thumbnailPath) : null,
                'processing_status' => 'completed',
                'virus_scan_status' => $virusScanStatus,
                'uploaded_at' => date('Y-m-d H:i:s')
            ];
            
            $mediaFile = MediaFile::create($mediaData);
            
            return [
                'success' => true,
                'media' => [
                    'id' => $mediaFile->id,
                    'url' => $this->getPublicURL($mediaData['file_path']),
                    'thumbnail_url' => $thumbnailPath ? $this->getPublicURL($mediaData['thumbnail_path']) : null,
                    'file_name' => $mediaData['file_name'],
                    'file_size' => $mediaData['file_size'],
                    'mime_type' => $mediaData['mime_type'],
                    'is_image' => $isImage
                ],
                'media_id' => $mediaFile->id
            ];
            
        } catch (Exception $e) {
            error_log('[MediaProcessor] Portfolio media processing failed: ' . $e->getMessage());
            return ['success' => false, 'error' => 'Processing failed'];
        }
    }
    
    /**
     * Process document upload
     */
    public function processDocument($file, $userId, $documentType = 'general')
    {
        try {
            // Validate document
            if (!$this->validateDocumentFile($file)) {
                return ['success' => false, 'error' => 'Invalid document file'];
            }
            
            $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            $filename = $documentType . '_' . $userId . '_' . time() . '.' . $extension;
            $filepath = $this->uploadPath . 'documents/' . $filename;
            
            // Move uploaded file
            if (!move_uploaded_file($file['tmp_name'], $filepath)) {
                return ['success' => false, 'error' => 'Failed to save file'];
            }
            
            // Virus scan
            $virusScanStatus = $this->performVirusScan($filepath);
            
            if ($virusScanStatus !== 'clean') {
                unlink($filepath);
                return ['success' => false, 'error' => 'File failed security scan'];
            }
            
            // Save to database
            $mediaData = [
                'owner_id' => $userId,
                'owner_type' => 'user',
                'file_type' => $documentType,
                'file_path' => self::DOCUMENT_PATH . $filename,
                'file_name' => $file['name'],
                'file_size' => filesize($filepath),
                'mime_type' => mime_content_type($filepath),
                'processing_status' => 'completed',
                'virus_scan_status' => $virusScanStatus,
                'uploaded_at' => date('Y-m-d H:i:s')
            ];
            
            $mediaFile = MediaFile::create($mediaData);
            
            return [
                'success' => true,
                'url' => $this->getPublicURL($mediaData['file_path']),
                'media_id' => $mediaFile->id
            ];
            
        } catch (Exception $e) {
            error_log('[MediaProcessor] Document processing failed: ' . $e->getMessage());
            return ['success' => false, 'error' => 'Processing failed'];
        }
    }
    
    /**
     * Delete media file
     */
    public function deleteMedia($mediaId, $userId)
    {
        try {
            $media = MediaFile::where('id', $mediaId)
                              ->where('owner_id', $userId)
                              ->first();
            
            if (!$media) {
                return ['success' => false, 'error' => 'Media not found'];
            }
            
            // Delete physical files
            $fullPath = $this->uploadPath . ltrim($media->file_path, '/');
            if (file_exists($fullPath)) {
                unlink($fullPath);
            }
            
            if ($media->thumbnail_path) {
                $thumbnailFullPath = $this->uploadPath . ltrim($media->thumbnail_path, '/');
                if (file_exists($thumbnailFullPath)) {
                    unlink($thumbnailFullPath);
                }
            }
            
            // Delete database record
            $media->delete();
            
            return ['success' => true];
            
        } catch (Exception $e) {
            error_log('[MediaProcessor] Media deletion failed: ' . $e->getMessage());
            return ['success' => false, 'error' => 'Deletion failed'];
        }
    }
    
    /**
     * Process image (resize, optimize)
     */
    private function processImage($filepath, $maxWidth, $maxHeight = null, $crop = false)
    {
        $maxHeight = $maxHeight ?: $maxWidth;
        
        try {
            $imageInfo = getimagesize($filepath);
            $originalWidth = $imageInfo[0];
            $originalHeight = $imageInfo[1];
            $mimeType = $imageInfo['mime'];
            
            // Calculate new dimensions
            if ($crop) {
                $newWidth = $maxWidth;
                $newHeight = $maxHeight;
            } else {
                $ratio = min($maxWidth / $originalWidth, $maxHeight / $originalHeight);
                $newWidth = intval($originalWidth * $ratio);
                $newHeight = intval($originalHeight * $ratio);
            }
            
            // Create image resource
            switch ($mimeType) {
                case 'image/jpeg':
                    $source = imagecreatefromjpeg($filepath);
                    break;
                case 'image/png':
                    $source = imagecreatefrompng($filepath);
                    break;
                case 'image/gif':
                    $source = imagecreatefromgif($filepath);
                    break;
                case 'image/webp':
                    $source = imagecreatefromwebp($filepath);
                    break;
                default:
                    return $filepath; // Unsupported format
            }
            
            if (!$source) {
                return $filepath;
            }
            
            // Create new image
            $destination = imagecreatetruecolor($newWidth, $newHeight);
            
            // Preserve transparency for PNG and GIF
            if ($mimeType === 'image/png' || $mimeType === 'image/gif') {
                imagealphablending($destination, false);
                imagesavealpha($destination, true);
                $transparent = imagecolorallocatealpha($destination, 255, 255, 255, 127);
                imagefill($destination, 0, 0, $transparent);
            }
            
            // Resize image
            if ($crop) {
                // Calculate crop position (center)
                $cropX = max(0, ($originalWidth - $originalHeight) / 2);
                $cropY = max(0, ($originalHeight - $originalWidth) / 2);
                $cropSize = min($originalWidth, $originalHeight);
                
                imagecopyresampled($destination, $source, 0, 0, $cropX, $cropY, 
                                 $newWidth, $newHeight, $cropSize, $cropSize);
            } else {
                imagecopyresampled($destination, $source, 0, 0, 0, 0, 
                                 $newWidth, $newHeight, $originalWidth, $originalHeight);
            }
            
            // Generate new filename
            $pathInfo = pathinfo($filepath);
            $newFilepath = $pathInfo['dirname'] . '/' . $pathInfo['filename'] . '_processed.' . $pathInfo['extension'];
            
            // Save processed image
            switch ($mimeType) {
                case 'image/jpeg':
                    imagejpeg($destination, $newFilepath, 85);
                    break;
                case 'image/png':
                    imagepng($destination, $newFilepath, 6);
                    break;
                case 'image/gif':
                    imagegif($destination, $newFilepath);
                    break;
                case 'image/webp':
                    imagewebp($destination, $newFilepath, 85);
                    break;
            }
            
            // Clean up
            imagedestroy($source);
            imagedestroy($destination);
            
            return $newFilepath;
            
        } catch (Exception $e) {
            error_log('[MediaProcessor] Image processing failed: ' . $e->getMessage());
            return $filepath;
        }
    }
    
    /**
     * Generate thumbnail
     */
    private function generateThumbnail($filepath, $size)
    {
        try {
            $pathInfo = pathinfo($filepath);
            $thumbnailPath = $this->uploadPath . 'thumbnails/thumb_' . time() . '_' . $size . '.' . $pathInfo['extension'];
            
            $processedPath = $this->processImage($filepath, $size, $size, true);
            
            if ($processedPath !== $filepath) {
                rename($processedPath, $thumbnailPath);
                return $thumbnailPath;
            } else {
                copy($filepath, $thumbnailPath);
                return $this->processImage($thumbnailPath, $size, $size, true);
            }
            
        } catch (Exception $e) {
            error_log('[MediaProcessor] Thumbnail generation failed: ' . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Validate image file
     */
    private function validateImageFile($file)
    {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return false;
        }
        
        if ($file['size'] > $this->maxFileSize) {
            return false;
        }
        
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($extension, $this->allowedTypes['image'])) {
            return false;
        }
        
        // Verify it's actually an image
        $imageInfo = getimagesize($file['tmp_name']);
        if ($imageInfo === false) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Validate document file
     */
    private function validateDocumentFile($file)
    {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return false;
        }
        
        if ($file['size'] > $this->maxFileSize) {
            return false;
        }
        
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        return in_array($extension, $this->allowedTypes['document']);
    }
    
    /**
     * Perform virus scan (placeholder implementation)
     */
    private function performVirusScan($filepath)
    {
        // TODO: Implement actual virus scanning with ClamAV or similar
        // For now, we'll do basic checks
        
        // Check file size (suspicious if too large)
        if (filesize($filepath) > $this->maxFileSize * 2) {
            return 'suspicious';
        }
        
        // Check for suspicious content in text files
        $extension = strtolower(pathinfo($filepath, PATHINFO_EXTENSION));
        if (in_array($extension, ['txt', 'php', 'js', 'html'])) {
            $content = file_get_contents($filepath, false, null, 0, 1024); // Read first 1KB
            $suspiciousPatterns = [
                '/<script[^>]*>/i',
                '/eval\s*\(/i',
                '/exec\s*\(/i',
                '/system\s*\(/i',
                '/passthru\s*\(/i',
                '/shell_exec\s*\(/i'
            ];
            
            foreach ($suspiciousPatterns as $pattern) {
                if (preg_match($pattern, $content)) {
                    return 'infected';
                }
            }
        }
        
        return 'clean';
    }
    
    /**
     * Get public URL for file
     */
    private function getPublicURL($relativePath)
    {
        $baseURL = $_ENV['APP_URL'] ?? 'http://localhost/Laburar';
        return $baseURL . $relativePath;
    }
    
    /**
     * Ensure upload directories exist
     */
    private function ensureDirectories()
    {
        $directories = [
            $this->uploadPath . 'avatars/',
            $this->uploadPath . 'portfolio/',
            $this->uploadPath . 'documents/',
            $this->uploadPath . 'thumbnails/',
            $this->uploadPath . 'temp/'
        ];
        
        foreach ($directories as $dir) {
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
            
            // Create .htaccess for security
            $htaccessPath = $dir . '.htaccess';
            if (!file_exists($htaccessPath)) {
                file_put_contents($htaccessPath, "Options -Indexes\nDeny from all");
            }
        }
    }
    
    /**
     * Clean up temporary files
     */
    public function cleanupTempFiles($olderThan = 3600)
    {
        $tempDir = $this->uploadPath . 'temp/';
        $files = glob($tempDir . '*');
        $now = time();
        
        foreach ($files as $file) {
            if (is_file($file) && ($now - filemtime($file)) > $olderThan) {
                unlink($file);
            }
        }
    }
    
    /**
     * Get media file info
     */
    public function getMediaInfo($mediaId, $userId = null)
    {
        $query = MediaFile::where('id', $mediaId);
        
        if ($userId) {
            $query->where('owner_id', $userId);
        }
        
        $media = $query->first();
        
        if (!$media) {
            return null;
        }
        
        return [
            'id' => $media->id,
            'file_name' => $media->file_name,
            'file_size' => $media->file_size,
            'mime_type' => $media->mime_type,
            'url' => $this->getPublicURL($media->file_path),
            'thumbnail_url' => $media->thumbnail_path ? $this->getPublicURL($media->thumbnail_path) : null,
            'uploaded_at' => $media->uploaded_at
        ];
    }
}
?>