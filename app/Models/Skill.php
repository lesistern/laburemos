<?php
/**
 * Skill Model
 * LaburAR Complete Platform - Skills Management
 */

require_once __DIR__ . '/BaseModel.php';

class Skill extends BaseModel
{
    protected $table = 'skills';
    
    protected $fillable = [
        'name',
        'category',
        'subcategory',
        'difficulty_level',
        'market_demand',
        'description',
        'is_active'
    ];
    
    /**
     * Get skills by category
     */
    public static function getByCategory($category)
    {
        return self::where('category', $category)->where('is_active', 1);
    }
    
    /**
     * Search skills
     */
    public static function search($query)
    {
        $sql = "SELECT * FROM skills 
                WHERE is_active = 1 AND (
                    MATCH(name, description) AGAINST (? IN NATURAL LANGUAGE MODE)
                    OR name LIKE ?
                ) ORDER BY name ASC";
        
        $instance = new self();
        $stmt = $instance->db->prepare($sql);
        $stmt->execute([$query, '%' . $query . '%']);
        
        return new ModelCollection($stmt->fetchAll(), self::class);
    }
}
?>