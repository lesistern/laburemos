<?php
/**
 * Base Model Class
 * LaburAR Complete Platform - Base ORM-like functionality
 * Generated: 2025-01-18
 * Version: 1.0
 */

require_once __DIR__ . '/../includes/Database.php';

abstract class BaseModel
{
    protected $db;
    protected $table;
    protected $primaryKey = 'id';
    protected $fillable = [];
    protected $hidden = [];
    protected $dates = ['created_at', 'updated_at'];
    protected $attributes = [];
    protected $original = [];
    protected $exists = false;
    
    public function __construct($attributes = [])
    {
        $this->db = Database::getInstance()->getConnection();
        $this->fill($attributes);
    }
    
    /**
     * Fill model with attributes
     */
    public function fill($attributes)
    {
        foreach ($attributes as $key => $value) {
            if (in_array($key, $this->fillable) || empty($this->fillable)) {
                $this->setAttribute($key, $value);
            }
        }
        return $this;
    }
    
    /**
     * Set attribute value
     */
    public function setAttribute($key, $value)
    {
        $this->attributes[$key] = $value;
        return $this;
    }
    
    /**
     * Get attribute value
     */
    public function getAttribute($key)
    {
        return $this->attributes[$key] ?? null;
    }
    
    /**
     * Magic getter
     */
    public function __get($key)
    {
        return $this->getAttribute($key);
    }
    
    /**
     * Magic setter
     */
    public function __set($key, $value)
    {
        $this->setAttribute($key, $value);
    }
    
    /**
     * Find record by ID
     */
    public static function find($id)
    {
        $instance = new static();
        $sql = "SELECT * FROM {$instance->table} WHERE {$instance->primaryKey} = ? LIMIT 1";
        
        $stmt = $instance->db->prepare($sql);
        $stmt->execute([$id]);
        $data = $stmt->fetch();
        
        if ($data) {
            $model = new static($data);
            $model->exists = true;
            $model->original = $data;
            return $model;
        }
        
        return null;
    }
    
    /**
     * Find record by column value
     */
    public static function where($column, $operator, $value = null)
    {
        if ($value === null) {
            $value = $operator;
            $operator = '=';
        }
        
        $instance = new static();
        $sql = "SELECT * FROM {$instance->table} WHERE {$column} {$operator} ?";
        
        $stmt = $instance->db->prepare($sql);
        $stmt->execute([$value]);
        
        return new ModelCollection($stmt->fetchAll(), static::class);
    }
    
    /**
     * Find first record by column value
     */
    public static function whereFirst($column, $operator, $value = null)
    {
        $results = static::where($column, $operator, $value);
        return $results->first();
    }
    
    /**
     * Get all records
     */
    public static function all()
    {
        $instance = new static();
        $sql = "SELECT * FROM {$instance->table}";
        
        $stmt = $instance->db->prepare($sql);
        $stmt->execute();
        
        return new ModelCollection($stmt->fetchAll(), static::class);
    }
    
    /**
     * Create new record
     */
    public static function create($attributes)
    {
        $instance = new static($attributes);
        $instance->save();
        return $instance;
    }
    
    /**
     * Save model to database
     */
    public function save()
    {
        if ($this->exists) {
            return $this->update();
        } else {
            return $this->insert();
        }
    }
    
    /**
     * Insert new record
     */
    protected function insert()
    {
        $attributes = $this->getAttributesForSave();
        
        // Add timestamps
        if (in_array('created_at', $this->dates)) {
            $attributes['created_at'] = date('Y-m-d H:i:s');
        }
        if (in_array('updated_at', $this->dates)) {
            $attributes['updated_at'] = date('Y-m-d H:i:s');
        }
        
        $columns = array_keys($attributes);
        $placeholders = array_fill(0, count($attributes), '?');
        
        $sql = "INSERT INTO {$this->table} (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
        
        $stmt = $this->db->prepare($sql);
        $result = $stmt->execute(array_values($attributes));
        
        if ($result) {
            $this->setAttribute($this->primaryKey, $this->db->lastInsertId());
            $this->exists = true;
            $this->original = $this->attributes;
            return true;
        }
        
        return false;
    }
    
    /**
     * Update existing record
     */
    protected function update()
    {
        $attributes = $this->getAttributesForSave();
        
        // Add updated timestamp
        if (in_array('updated_at', $this->dates)) {
            $attributes['updated_at'] = date('Y-m-d H:i:s');
        }
        
        $sets = [];
        foreach (array_keys($attributes) as $column) {
            $sets[] = "{$column} = ?";
        }
        
        $sql = "UPDATE {$this->table} SET " . implode(', ', $sets) . " WHERE {$this->primaryKey} = ?";
        
        $values = array_values($attributes);
        $values[] = $this->getAttribute($this->primaryKey);
        
        $stmt = $this->db->prepare($sql);
        $result = $stmt->execute($values);
        
        if ($result) {
            $this->original = $this->attributes;
            return true;
        }
        
        return false;
    }
    
    /**
     * Delete record
     */
    public function delete()
    {
        if (!$this->exists) {
            return false;
        }
        
        $sql = "DELETE FROM {$this->table} WHERE {$this->primaryKey} = ?";
        $stmt = $this->db->prepare($sql);
        $result = $stmt->execute([$this->getAttribute($this->primaryKey)]);
        
        if ($result) {
            $this->exists = false;
            return true;
        }
        
        return false;
    }
    
    /**
     * Get attributes for saving (excluding hidden)
     */
    protected function getAttributesForSave()
    {
        $attributes = $this->attributes;
        
        // Remove hidden attributes
        foreach ($this->hidden as $hidden) {
            unset($attributes[$hidden]);
        }
        
        // Remove primary key for inserts
        if (!$this->exists) {
            unset($attributes[$this->primaryKey]);
        }
        
        return $attributes;
    }
    
    /**
     * Convert to array
     */
    public function toArray()
    {
        $array = $this->attributes;
        
        // Remove hidden attributes
        foreach ($this->hidden as $hidden) {
            unset($array[$hidden]);
        }
        
        return $array;
    }
    
    /**
     * Convert to JSON
     */
    public function toJson()
    {
        return json_encode($this->toArray());
    }
    
    /**
     * Check if model exists in database
     */
    public function exists()
    {
        return $this->exists;
    }
}

/**
 * Collection class for handling multiple models
 */
class ModelCollection implements Iterator, Countable
{
    private $items = [];
    private $position = 0;
    private $modelClass;
    
    public function __construct($data, $modelClass)
    {
        $this->modelClass = $modelClass;
        $this->position = 0;
        
        foreach ($data as $item) {
            $model = new $modelClass($item);
            $model->exists = true;
            $model->original = $item;
            $this->items[] = $model;
        }
    }
    
    public function first()
    {
        return $this->items[0] ?? null;
    }
    
    public function last()
    {
        return end($this->items) ?: null;
    }
    
    public function count(): int
    {
        return count($this->items);
    }
    
    public function toArray()
    {
        return array_map(function($item) {
            return $item->toArray();
        }, $this->items);
    }
    
    // Iterator interface
    public function rewind(): void
    {
        $this->position = 0;
    }
    
    public function current()
    {
        return $this->items[$this->position];
    }
    
    public function key()
    {
        return $this->position;
    }
    
    public function next(): void
    {
        ++$this->position;
    }
    
    public function valid(): bool
    {
        return isset($this->items[$this->position]);
    }
}
?>